#!/usr/bin/env node
/**
 * session-stats.mjs — comprehensive single-session token & activity analyzer
 *
 * Usage:
 *   node session-stats.mjs <sessionId> [--project <projectDir>] [--pretty]
 *   node session-stats.mjs --latest                              # most recent session in cwd's project
 *   node session-stats.mjs <sessionId> --pretty                  # human-readable output instead of JSON
 *
 * Output: JSON to stdout. Pipe to jq, or use --pretty for a text summary.
 *
 * P0/P1 fields (token-discipline attribution):
 *   tool_use_details.{bash,read,edit_write,agent,skill}  — tool input payload aggregation
 *   subagents.agents[]                                  — per-subagent breakdown (tools, prompt, tokens)
 *   branches[]                                          — gitBranch transitions per turn
 *   retries.duplicate_request_ids                       — same requestId observed >1×
 *   pause_distribution.{p50,p90,p99,max,over_5min}      — inter-turn gap histogram (cache TTL)
 *   bash_failures.{count,samples}                       — Bash tool_result with is_error
 *   tool_result_sizes.{p50,p95,max,total_chars}         — result payload size dist
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const argv = process.argv.slice(2);
const PRETTY = argv.includes('--pretty');
const LATEST = argv.includes('--latest');
const projIdx = argv.indexOf('--project');
const projectArg = projIdx >= 0 ? argv[projIdx + 1] : null;
const sidArg = argv.find((a) => /^[0-9a-f]{8}-/.test(a));

const PROJECTS_ROOT = path.join(os.homedir(), '.claude', 'projects');

// ---------- locate transcript ----------
function findTranscript() {
  if (LATEST) {
    const cwdProj = process.cwd().replace(/\//g, '-');
    const dir = path.join(PROJECTS_ROOT, cwdProj);
    if (!fs.existsSync(dir)) throw new Error(`No project dir for cwd: ${dir}`);
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    if (!files.length) throw new Error(`No .jsonl files in ${dir}`);
    return { sid: files[0].f.replace('.jsonl', ''), dir };
  }
  if (!sidArg) throw new Error('Usage: session-stats.mjs <sessionId> | --latest');
  if (projectArg) {
    const dir = path.join(PROJECTS_ROOT, projectArg);
    if (fs.existsSync(path.join(dir, sidArg + '.jsonl'))) return { sid: sidArg, dir };
  }
  for (const p of fs.readdirSync(PROJECTS_ROOT)) {
    const dir = path.join(PROJECTS_ROOT, p);
    if (!fs.statSync(dir).isDirectory()) continue;
    if (fs.existsSync(path.join(dir, sidArg + '.jsonl'))) return { sid: sidArg, dir };
  }
  throw new Error(`Transcript not found for session ${sidArg}`);
}

// ---------- helpers ----------
function bashPattern(cmd) {
  const trimmed = cmd.trim().slice(0, 200);
  const first = trimmed.split(/[\s|&;]/)[0] || '';
  if (first === 'npm') {
    if (/\blint\b/.test(trimmed)) return 'npm:lint';
    if (/\btypecheck\b/.test(trimmed)) return 'npm:typecheck';
    if (/\btest\b/.test(trimmed)) return 'npm:test';
    if (/\bbuild\b/.test(trimmed)) return 'npm:build';
    if (/\brun\b/.test(trimmed)) return 'npm:run';
    return 'npm';
  }
  if (first === 'git') {
    const sub = trimmed.split(/\s+/)[1] || '';
    return `git:${sub}`;
  }
  if (first === 'gh') {
    const sub = trimmed.split(/\s+/)[1] || '';
    return `gh:${sub}`;
  }
  if (first === 'find') return 'find';
  if (first === 'rg' || first === 'grep') return 'grep';
  if (first === 'sed') return 'sed';
  if (first === 'ls') return 'ls';
  if (first === 'cat' || first === 'head' || first === 'tail') return 'cat-like';
  if (first === 'wc') return 'wc';
  if (first === 'jq') return 'jq';
  if (first === 'cd') return 'cd';
  if (first === 'echo') return 'echo';
  if (first === 'rm' || first === 'mv' || first === 'cp') return `fs:${first}`;
  if (first === 'mkdir') return 'fs:mkdir';
  if (first === 'kill') return 'kill';
  if (first === 'until') return 'wait-loop';
  if (first === 'pwd') return 'pwd';
  if (first.includes('/')) {
    if (first.startsWith('.claude/skills/')) return 'skill-helper';
    if (first.startsWith('./') || first.startsWith('/')) return 'script';
  }
  return first.slice(0, 20) || 'unknown';
}

function pct(arr, p) {
  if (!arr.length) return 0;
  const i = Math.min(arr.length - 1, Math.floor(arr.length * p));
  return arr[i];
}

const { sid, dir } = findTranscript();
const fp = path.join(dir, sid + '.jsonl');
const subdir = path.join(dir, sid, 'subagents');

// ---------- parse main transcript ----------
const lines = fs.readFileSync(fp, 'utf8').split('\n').filter(Boolean);
const events = lines
  .map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const seenReq = new Set();
const seenUuid = new Set();
const toolUseById = {}; // tool_use_id → tool name (for bash_failures linking)

const stats = {
  session: sid,
  project: path.basename(dir),
  file: fp,
  span: { from: null, to: null, wall_ms: 0, active_ms: 0 },
  models: {},
  api_calls: 0,
  events: { total: events.length, by_type: {} },
  permission_mode_changes: 0,
  file_history_snapshots: 0,
  attachments: 0,
  ai_titles: 0,
  human_messages: 0,
  slash_commands: 0,
  natural_language_msgs: 0,
  tokens: {
    grand_total: 0,
    input_total: 0,
    input_uncached: 0,
    cache_create: 0,
    cache_read: 0,
    output: 0,
    cache_hit_rate: 0,
    avg_output_per_call: 0,
  },
  by_prompt: [],
  by_skill: {},
  by_tool: {},
  cache_invalidation: { events: 0, peak_create: 0 },
  output_per_call: [],
  subagents: { total_calls: 0, total_tokens: 0, by_type: {}, agents: [] },
  todos_files: [],

  // ----- P0/P1 additions -----
  tool_use_details: {
    bash: { total: 0, by_pattern: {} },
    read: { total: 0, claudemd_count: 0, by_extension: {}, _by_file: {}, top_files: {} },
    edit_write: { total: 0, _by_file: {}, top_files: {} },
    agent: { total: 0, by_subagent_type: {}, by_model: {}, dispatches: [] },
    skill: { invocations: [] },
  },
  branches: [],
  retries: { duplicate_request_ids: 0 },
  pause_distribution: { _gaps: [], over_5min: 0, p50_ms: 0, p90_ms: 0, p99_ms: 0, max_ms: 0 },
  bash_failures: { count: 0, samples: [] },
  tool_result_sizes: { _lengths: [], total_chars: 0, p50: 0, p95: 0, max: 0 },
};

let lastTs = null;
let lastBranch = null;
let currentPrompt = null;

for (const e of events) {
  if (e.uuid) {
    if (seenUuid.has(e.uuid)) continue;
    seenUuid.add(e.uuid);
  }

  // span + active time + pause distribution
  if (e.timestamp) {
    if (!stats.span.from || e.timestamp < stats.span.from) stats.span.from = e.timestamp;
    if (!stats.span.to || e.timestamp > stats.span.to) stats.span.to = e.timestamp;
    if (lastTs) {
      const gap = new Date(e.timestamp) - new Date(lastTs);
      if (gap > 0) {
        stats.pause_distribution._gaps.push(gap);
        if (gap < 5 * 60 * 1000) stats.span.active_ms += gap;
        else stats.pause_distribution.over_5min++;
      }
    }
    lastTs = e.timestamp;
  }

  // gitBranch transitions
  if (e.gitBranch && e.gitBranch !== lastBranch) {
    stats.branches.push({ ts: e.timestamp || null, gitBranch: e.gitBranch });
    lastBranch = e.gitBranch;
  }

  stats.events.by_type[e.type] = (stats.events.by_type[e.type] || 0) + 1;
  if (e.type === 'permission-mode') stats.permission_mode_changes++;
  if (e.type === 'file-history-snapshot') stats.file_history_snapshots++;
  if (e.type === 'attachment') stats.attachments++;
  if (e.type === 'ai-title') stats.ai_titles++;

  // human messages
  if (
    e.type === 'user' &&
    e.message?.role === 'user' &&
    !e.isMeta &&
    !e.isSidechain &&
    !e.isCompactSummary
  ) {
    const c = e.message.content;
    if (typeof c === 'string' && !c.includes('tool_use_id') && !c.startsWith('Caveat:')) {
      stats.human_messages++;
      if (c.startsWith('<command-name>') || c.startsWith('/')) stats.slash_commands++;
      else stats.natural_language_msgs++;
      currentPrompt = {
        ts: e.timestamp,
        text: c.slice(0, 140).replace(/\n/g, ' '),
        is_slash: c.startsWith('<command-name>') || c.startsWith('/'),
        calls: 0,
        tokens: 0,
        in_uncached: 0,
        cache_create: 0,
        cache_read: 0,
        out: 0,
      };
      stats.by_prompt.push(currentPrompt);
    }
  }

  // user tool_result blocks (bash failures, result sizes)
  if (e.type === 'user' && Array.isArray(e.message?.content)) {
    for (const blk of e.message.content) {
      if (blk.type !== 'tool_result') continue;
      const txt = typeof blk.content === 'string' ? blk.content : JSON.stringify(blk.content || '');
      stats.tool_result_sizes._lengths.push(txt.length);
      stats.tool_result_sizes.total_chars += txt.length;
      const linkedTool = toolUseById[blk.tool_use_id];
      if (blk.is_error && linkedTool === 'Bash') {
        stats.bash_failures.count++;
        if (stats.bash_failures.samples.length < 5) {
          stats.bash_failures.samples.push({
            ts: e.timestamp || null,
            error_first80: txt.slice(0, 80).replace(/\n/g, ' '),
          });
        }
      }
    }
  }

  // assistant API usage
  const u = e.message?.usage;
  const rid = e.requestId || e.message?.id;
  if (u && rid) {
    if (seenReq.has(rid)) {
      stats.retries.duplicate_request_ids++;
    } else {
      seenReq.add(rid);
      stats.api_calls++;
      const i = u.input_tokens || 0;
      const a = u.cache_creation_input_tokens || 0;
      const b = u.cache_read_input_tokens || 0;
      const o = u.output_tokens || 0;
      const t = i + a + b + o;
      stats.tokens.input_uncached += i;
      stats.tokens.cache_create += a;
      stats.tokens.cache_read += b;
      stats.tokens.output += o;
      stats.output_per_call.push(o);

      if (a > 50000) {
        stats.cache_invalidation.events++;
        if (a > stats.cache_invalidation.peak_create) stats.cache_invalidation.peak_create = a;
      }

      const m = e.message?.model || 'unknown';
      if (!stats.models[m]) stats.models[m] = { calls: 0, tokens: 0 };
      stats.models[m].calls++;
      stats.models[m].tokens += t;

      if (currentPrompt) {
        currentPrompt.calls++;
        currentPrompt.tokens += t;
        currentPrompt.in_uncached += i;
        currentPrompt.cache_create += a;
        currentPrompt.cache_read += b;
        currentPrompt.out += o;
      }
    }
  }

  // tool uses (P0: capture input details)
  if (e.type === 'assistant' && Array.isArray(e.message?.content)) {
    for (const blk of e.message.content) {
      if (blk.type !== 'tool_use') continue;
      stats.by_tool[blk.name] = (stats.by_tool[blk.name] || 0) + 1;
      if (blk.id) toolUseById[blk.id] = blk.name;

      const td = stats.tool_use_details;

      if (blk.name === 'Skill' && blk.input?.skill) {
        stats.by_skill[blk.input.skill] = (stats.by_skill[blk.input.skill] || 0) + 1;
        td.skill.invocations.push({
          ts: e.timestamp || null,
          skill: blk.input.skill,
          args_first80: (blk.input.args || '').slice(0, 80).replace(/\n/g, ' '),
        });
      }

      if (blk.name === 'Bash' && blk.input?.command) {
        td.bash.total++;
        const pat = bashPattern(blk.input.command);
        td.bash.by_pattern[pat] = (td.bash.by_pattern[pat] || 0) + 1;
      }

      if (blk.name === 'Read' && blk.input?.file_path) {
        td.read.total++;
        const fpr = blk.input.file_path;
        const base = path.basename(fpr);
        const ext = path.extname(fpr).slice(1) || 'noext';
        if (base === 'CLAUDE.md' || base === 'AGENTS.md') td.read.claudemd_count++;
        td.read.by_extension[ext] = (td.read.by_extension[ext] || 0) + 1;
        td.read._by_file[fpr] = (td.read._by_file[fpr] || 0) + 1;
      }

      if ((blk.name === 'Edit' || blk.name === 'Write') && blk.input?.file_path) {
        td.edit_write.total++;
        td.edit_write._by_file[blk.input.file_path] =
          (td.edit_write._by_file[blk.input.file_path] || 0) + 1;
      }

      if (blk.name === 'Agent') {
        td.agent.total++;
        const sty = blk.input?.subagent_type || 'general-purpose';
        const md = blk.input?.model || 'inherit';
        td.agent.by_subagent_type[sty] = (td.agent.by_subagent_type[sty] || 0) + 1;
        td.agent.by_model[md] = (td.agent.by_model[md] || 0) + 1;
        if (td.agent.dispatches.length < 30) {
          td.agent.dispatches.push({
            ts: e.timestamp || null,
            subagent_type: sty,
            model: md,
            description: blk.input?.description || '',
            prompt_first80: (blk.input?.prompt || '').slice(0, 80).replace(/\n/g, ' '),
          });
        }
      }
    }
  }
}

// ---------- subagents (P0: per-agent breakdown) ----------
if (fs.existsSync(subdir)) {
  for (const f of fs.readdirSync(subdir)) {
    if (!f.endsWith('.jsonl')) continue;
    const sp = path.join(subdir, f);
    const meta = sp.replace('.jsonl', '.meta.json');
    let agentType = 'unknown';
    let agentModel = '';
    let parentToolUseId = null;
    if (fs.existsSync(meta)) {
      try {
        const m = JSON.parse(fs.readFileSync(meta, 'utf8'));
        agentType = m.agentType || m.subagent_type || 'unknown';
        agentModel = m.model || '';
        parentToolUseId = m.toolUseId || m.tool_use_id || null;
      } catch {}
    }
    const agentInfo = {
      file: f,
      agentType,
      model: agentModel,
      parent_tool_use_id: parentToolUseId,
      calls: 0,
      tokens: 0,
      input_uncached: 0,
      cache_create: 0,
      cache_read: 0,
      output: 0,
      by_tool: {},
      prompt_first80: '',
      first_ts: null,
      last_ts: null,
    };
    const sseen = new Set();
    for (const ln of fs.readFileSync(sp, 'utf8').split('\n').filter(Boolean)) {
      let m;
      try {
        m = JSON.parse(ln);
      } catch {
        continue;
      }
      if (m.timestamp) {
        if (!agentInfo.first_ts || m.timestamp < agentInfo.first_ts)
          agentInfo.first_ts = m.timestamp;
        if (!agentInfo.last_ts || m.timestamp > agentInfo.last_ts) agentInfo.last_ts = m.timestamp;
      }
      if (
        !agentInfo.prompt_first80 &&
        m.type === 'user' &&
        typeof m.message?.content === 'string'
      ) {
        const c = m.message.content;
        if (!c.includes('tool_use_id')) {
          agentInfo.prompt_first80 = c.slice(0, 80).replace(/\n/g, ' ');
        }
      }
      const u = m.message?.usage;
      const rid = m.requestId || m.message?.id;
      if (u && rid && !sseen.has(rid)) {
        sseen.add(rid);
        agentInfo.calls++;
        const i = u.input_tokens || 0;
        const a = u.cache_creation_input_tokens || 0;
        const b = u.cache_read_input_tokens || 0;
        const o = u.output_tokens || 0;
        agentInfo.input_uncached += i;
        agentInfo.cache_create += a;
        agentInfo.cache_read += b;
        agentInfo.output += o;
        agentInfo.tokens += i + a + b + o;
        if (!agentModel && m.message?.model) agentInfo.model = m.message.model;
      }
      if (m.type === 'assistant' && Array.isArray(m.message?.content)) {
        for (const blk of m.message.content) {
          if (blk.type !== 'tool_use') continue;
          agentInfo.by_tool[blk.name] = (agentInfo.by_tool[blk.name] || 0) + 1;
        }
      }
    }
    if (!stats.subagents.by_type[agentType])
      stats.subagents.by_type[agentType] = { runs: 0, calls: 0, tokens: 0 };
    stats.subagents.by_type[agentType].runs++;
    stats.subagents.by_type[agentType].calls += agentInfo.calls;
    stats.subagents.by_type[agentType].tokens += agentInfo.tokens;
    stats.subagents.total_calls += agentInfo.calls;
    stats.subagents.total_tokens += agentInfo.tokens;
    stats.subagents.agents.push(agentInfo);
  }
}

// ---------- todos ----------
const todosDir = path.join(os.homedir(), '.claude', 'todos');
if (fs.existsSync(todosDir)) {
  stats.todos_files = fs.readdirSync(todosDir).filter((f) => f.includes(sid));
}

// ---------- derived ----------
stats.tokens.input_total =
  stats.tokens.input_uncached + stats.tokens.cache_create + stats.tokens.cache_read;
stats.tokens.grand_total = stats.tokens.input_total + stats.tokens.output;
stats.tokens.cache_hit_rate = stats.tokens.input_total
  ? +((stats.tokens.cache_read / stats.tokens.input_total) * 100).toFixed(2)
  : 0;
stats.tokens.avg_output_per_call = stats.api_calls
  ? Math.round(stats.tokens.output / stats.api_calls)
  : 0;
if (stats.span.from && stats.span.to) {
  stats.span.wall_ms = new Date(stats.span.to) - new Date(stats.span.from);
}

stats.by_prompt.sort((a, b) => b.tokens - a.tokens);

// pause distribution percentiles
{
  const g = stats.pause_distribution._gaps.slice().sort((a, b) => a - b);
  stats.pause_distribution.p50_ms = pct(g, 0.5);
  stats.pause_distribution.p90_ms = pct(g, 0.9);
  stats.pause_distribution.p99_ms = pct(g, 0.99);
  stats.pause_distribution.max_ms = g.length ? g[g.length - 1] : 0;
  stats.pause_distribution.count = g.length;
  delete stats.pause_distribution._gaps;
}

// tool_result size percentiles
{
  const l = stats.tool_result_sizes._lengths.slice().sort((a, b) => a - b);
  stats.tool_result_sizes.p50 = pct(l, 0.5);
  stats.tool_result_sizes.p95 = pct(l, 0.95);
  stats.tool_result_sizes.max = l.length ? l[l.length - 1] : 0;
  stats.tool_result_sizes.count = l.length;
  delete stats.tool_result_sizes._lengths;
}

// top_files trim
function trimTopFiles(obj, n = 10) {
  return Object.fromEntries(
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n),
  );
}
stats.tool_use_details.read.top_files = trimTopFiles(stats.tool_use_details.read._by_file, 15);
stats.tool_use_details.edit_write.top_files = trimTopFiles(
  stats.tool_use_details.edit_write._by_file,
  15,
);
delete stats.tool_use_details.read._by_file;
delete stats.tool_use_details.edit_write._by_file;

// sort subagents.agents by tokens desc
stats.subagents.agents.sort((a, b) => b.tokens - a.tokens);

// ---------- output ----------
if (PRETTY) {
  const fmt = (n) => n.toLocaleString();
  const pctStr = (a, b) => (b ? ((a / b) * 100).toFixed(1) + '%' : '-');
  const dur = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    const s = Math.floor(ms / 1000),
      m = Math.floor(s / 60),
      h = Math.floor(m / 60);
    return h ? `${h}h ${m % 60}m` : m ? `${m}m ${s % 60}s` : `${s}s`;
  };
  console.log(`\nSession: ${stats.session}  [${stats.project}]`);
  console.log(`Span: ${stats.span.from} → ${stats.span.to}`);
  console.log(`Wall: ${dur(stats.span.wall_ms)}  Active: ${dur(stats.span.active_ms)}`);
  console.log(`Models: ${Object.keys(stats.models).join(', ')}`);
  console.log(`\nTOKENS — grand total: ${fmt(stats.tokens.grand_total)}`);
  console.log(
    `  uncached     : ${fmt(stats.tokens.input_uncached).padStart(12)} (${pctStr(stats.tokens.input_uncached, stats.tokens.input_total)})`,
  );
  console.log(
    `  cache_create : ${fmt(stats.tokens.cache_create).padStart(12)} (${pctStr(stats.tokens.cache_create, stats.tokens.input_total)})`,
  );
  console.log(
    `  cache_read   : ${fmt(stats.tokens.cache_read).padStart(12)} (${pctStr(stats.tokens.cache_read, stats.tokens.input_total)})  ← cache hit ${stats.tokens.cache_hit_rate}%`,
  );
  console.log(`  output       : ${fmt(stats.tokens.output).padStart(12)}`);
  console.log(`  avg out/call : ${stats.tokens.avg_output_per_call} tok`);
  console.log(`\nACTIVITY`);
  console.log(
    `  api_calls: ${stats.api_calls}  retries(dup-rid): ${stats.retries.duplicate_request_ids}  human: ${stats.human_messages} (slash ${stats.slash_commands} / NL ${stats.natural_language_msgs})`,
  );
  console.log(
    `  attachments: ${stats.attachments}  permission-mode changes: ${stats.permission_mode_changes}  file-history-snapshots: ${stats.file_history_snapshots}`,
  );
  console.log(
    `  cache invalidation events (>50k cache_create): ${stats.cache_invalidation.events}, peak ${fmt(stats.cache_invalidation.peak_create)}`,
  );

  console.log(
    `\nPAUSES (turn gaps): p50=${dur(stats.pause_distribution.p50_ms)} p90=${dur(stats.pause_distribution.p90_ms)} p99=${dur(stats.pause_distribution.p99_ms)} max=${dur(stats.pause_distribution.max_ms)}  >5min: ${stats.pause_distribution.over_5min}`,
  );

  if (stats.branches.length) {
    console.log(`\nBRANCHES (${stats.branches.length} transitions)`);
    stats.branches.slice(0, 8).forEach((b) => console.log(`  ${b.ts || '?'}  ${b.gitBranch}`));
    if (stats.branches.length > 8) console.log(`  … ${stats.branches.length - 8} more`);
  }

  console.log(`\nTOP PROMPTS`);
  stats.by_prompt.slice(0, 10).forEach((p, i) => {
    console.log(
      `  ${i + 1}. ${fmt(p.tokens).padStart(10)} (${pctStr(p.tokens, stats.tokens.grand_total)})  calls=${p.calls}  "${p.text}"`,
    );
  });

  console.log(`\nTOOLS`);
  Object.entries(stats.by_tool)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}× ${k}`));

  if (stats.tool_use_details.bash.total) {
    console.log(`\nBASH PATTERNS (${stats.tool_use_details.bash.total} calls)`);
    Object.entries(stats.tool_use_details.bash.by_pattern)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}× ${k}`));
  }

  if (stats.tool_use_details.read.total) {
    console.log(
      `\nREAD (${stats.tool_use_details.read.total} calls, CLAUDE.md/AGENTS.md: ${stats.tool_use_details.read.claudemd_count})`,
    );
    console.log(`  by_extension:`);
    Object.entries(stats.tool_use_details.read.by_extension)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .forEach(([k, v]) => console.log(`    ${String(v).padStart(3)}× .${k}`));
    console.log(`  top files:`);
    Object.entries(stats.tool_use_details.read.top_files)
      .slice(0, 8)
      .forEach(([k, v]) => console.log(`    ${String(v).padStart(3)}× ${k}`));
  }

  if (stats.tool_use_details.edit_write.total) {
    console.log(`\nEDIT/WRITE (${stats.tool_use_details.edit_write.total} calls) top files:`);
    Object.entries(stats.tool_use_details.edit_write.top_files)
      .slice(0, 8)
      .forEach(([k, v]) => console.log(`  ${String(v).padStart(3)}× ${k}`));
  }

  if (stats.tool_use_details.agent.total) {
    console.log(`\nAGENT DISPATCHES (${stats.tool_use_details.agent.total} total)`);
    console.log(`  by subagent_type:`);
    Object.entries(stats.tool_use_details.agent.by_subagent_type)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`    ${String(v).padStart(3)}× ${k}`));
    console.log(`  by model:`);
    Object.entries(stats.tool_use_details.agent.by_model)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`    ${String(v).padStart(3)}× ${k}`));
  }

  console.log(`\nSKILLS via Skill tool: ${Object.keys(stats.by_skill).length || 'none'}`);
  Object.entries(stats.by_skill).forEach(([k, v]) => console.log(`  ${v}× ${k}`));

  console.log(
    `\nSUBAGENTS: ${stats.subagents.total_calls} calls, ${fmt(stats.subagents.total_tokens)} tokens, ${stats.subagents.agents.length} runs`,
  );
  Object.entries(stats.subagents.by_type).forEach(([k, v]) =>
    console.log(`  ${k}: ${v.runs} runs, ${v.calls} calls, ${fmt(v.tokens)} tokens`),
  );
  if (stats.subagents.agents.length) {
    console.log(`  top runs (by tokens):`);
    stats.subagents.agents.slice(0, 8).forEach((a, i) => {
      const tools = Object.entries(a.by_tool)
        .sort((x, y) => y[1] - x[1])
        .slice(0, 4)
        .map(([k, v]) => `${k}×${v}`)
        .join(' ');
      console.log(
        `    ${i + 1}. ${fmt(a.tokens).padStart(10)}  ${a.agentType}  ${a.model || '?'}  [${tools}]  "${a.prompt_first80}"`,
      );
    });
  }

  if (stats.bash_failures.count) {
    console.log(`\nBASH FAILURES: ${stats.bash_failures.count}`);
    stats.bash_failures.samples.forEach((s) => console.log(`  ${s.ts || '?'}  ${s.error_first80}`));
  }

  console.log(
    `\nTOOL RESULT SIZES: p50=${fmt(stats.tool_result_sizes.p50)}  p95=${fmt(stats.tool_result_sizes.p95)}  max=${fmt(stats.tool_result_sizes.max)}  total=${fmt(stats.tool_result_sizes.total_chars)} chars`,
  );

  console.log(`\nTODOS: ${stats.todos_files.length} files`);
} else {
  console.log(JSON.stringify(stats, null, 2));
}
