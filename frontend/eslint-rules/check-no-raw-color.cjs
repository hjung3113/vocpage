#!/usr/bin/env node
/**
 * Standalone scanner enforcing the Phase 8 §0 token rule:
 * no raw color literals in source — use var(--token-name) instead.
 *
 * Detects in .ts/.tsx files under the given root:
 *   - hex literals (#abc, #abcdef, #abcdef12)
 *   - rgb(), rgba(), oklch() function calls
 *
 * Allowed exception: a line containing
 *   `// allow-raw-color: <reason>`
 * is skipped. The reason text is mandatory.
 *
 * Exits 1 on the first matching scan with at least one violation.
 */
const fs = require('node:fs');
const path = require('node:path');

const RAW_COLOR_RE = /(#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\boklch\s*\()/;
const ALLOW_RE = /allow-raw-color\s*:\s*\S+/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      // tokens.ts is the canonical source for raw OKLCH values.
      if (entry.name === 'tokens.ts') continue;
      out.push(full);
    }
  }
  return out;
}

function scanFile(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const violations = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (ALLOW_RE.test(line)) continue;
    if (RAW_COLOR_RE.test(line)) {
      violations.push({ line: i + 1, text: line.trim() });
    }
  }
  return violations;
}

function main() {
  const root = process.argv[2] || 'src';
  const abs = path.resolve(root);
  if (!fs.existsSync(abs)) {
    console.error(`no-raw-color: path not found: ${abs}`);
    process.exit(2);
  }
  const files = walk(abs);
  let total = 0;
  for (const f of files) {
    const v = scanFile(f);
    if (v.length) {
      total += v.length;
      const rel = path.relative(process.cwd(), f);
      for (const { line, text } of v) {
        console.error(
          `${rel}:${line}: raw color literal — use var(--token-name) instead. (${text})`,
        );
      }
    }
  }
  if (total > 0) {
    console.error(
      `\nno-raw-color: ${total} violation(s). Use design tokens via var(--token-name).`,
    );
    process.exit(1);
  }
}

main();
