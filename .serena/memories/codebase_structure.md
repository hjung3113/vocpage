# Codebase Structure

```
vocpage/
├── CLAUDE.md              # authoritative governance
├── AGENTS.md              # thin pointer for non-Claude agents
├── claude-progress.txt    # session entrypoint (≤30 lines)
├── package.json           # root (workspaces)
├── docker-compose.yml
├── tsconfig.base.json
├── .eslintrc.base.js
├── frontend/              # React + Vite + Tailwind v4 SPA
│   └── CLAUDE.md
├── backend/               # Express + TS + PG/pgvector
│   └── CLAUDE.md
├── shared/                # cross-cutting TS contracts
│   └── contracts/voc/io.ts, contracts/master/io.ts (in progress)
├── prototype/             # static HTML reference (NOT prod code)
│   └── CLAUDE.md
├── docs/specs/
│   ├── README.md          # Documentation Hygiene (canonical)
│   ├── requires/          # requirements.md, uidesign.md
│   ├── plans/             # next-session-tasks.md, phase-N.md, done/
│   └── reviews/           # done/
├── benchmark/
├── scripts/
├── graphify-out/          # knowledge graph (GRAPH_REPORT.md, wiki/)
├── .github/
├── .claude/               # Claude Code config
├── .omc/                  # oh-my-claudecode state (notepad, plans, etc.)
└── .serena/               # Serena project metadata
```

## Active phase (as of 2026-05-01)

Phase 8 Wave 1.5. Next work: PR-α (`feat/wave1.5-contract-be`) — `shared/contracts/voc/io.ts`
extension + `shared/contracts/master/io.ts` new + BE repository/route + Supertest TDD.
Authoritative spec: `docs/specs/plans/phase-8.md §Wave 1.5`.

## Knowledge graph

`graphify-out/GRAPH_REPORT.md` — god nodes, communities. Read before architecture questions.
`graphify-out/wiki/index.md` — navigate this instead of raw files when present.
After modifying code: `graphify update .` to refresh (AST-only, free).
