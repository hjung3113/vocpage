# Suggested Commands (Darwin)

## Dev / run

- `docker compose up` — full stack (FE + BE + Postgres)
- See `frontend/CLAUDE.md` and `backend/CLAUDE.md` for FE-only / BE-only dev commands
- `npm run dev` (in `backend/`) — backend dev server (uses pino-pretty)

## Test

- Frontend: Vitest (`npm test` inside `frontend/`)
- Backend: Jest + Supertest (`npm test` inside `backend/`)
- Tail output: `npm test 2>&1 | tail -20` — never print full traces

## Lint / format

- ESLint via `.eslintrc.base.js`
- Prettier via `.prettierrc`

## Git workflow (enforced by hookify)

- Feature branch only: `docs/<topic>` / `feat/<topic>` / `fix/<topic>`
- **Never** commit/push to main directly
- PRs are opened by the user
- Merge: `gh pr merge <n> --merge --delete-branch` — `--squash` and `--rebase` are FORBIDDEN
- After merge: `git branch -D <branch>`

## Darwin shell notes

- BSD `sed` / `grep` — use `-E` for extended regex, `-i ''` for in-place
- `find . -name ...` (not `find /` — scans full FS, slow)
- Use ripgrep (`rg`) when available; otherwise `grep -rn`
