# Phase 6-6 Auth Mock PR Review

> Date: 2026-04-24
> Scope: PR branch `docs/sync-phase6-impl-to-requirements`
> Review target: Phase 6-6 auth mock implementation and related dev environment wiring

## Summary

Phase 6-6 auth mock implementation has passing unit/type/build checks, but the PR has environment integration gaps that can break local Docker/dev usage after merge.

Primary blockers before merge:

1. Docker backend healthcheck still targets the removed `/health` route.
2. Frontend auth client ignores `VITE_API_BASE_URL` and has no Vite `/api` proxy.

Secondary issues:

1. Missing `SESSION_SECRET` falls back to a known public value.
2. OIDC stub does not fail at boot, despite the approved Phase 6-6 plan saying it should.

## Findings

### P1 — Docker healthcheck now points at a removed route

- File: `backend/src/index.ts:26`
- Related file: `docker-compose.yml:41`
- Current behavior: backend exposes `GET /api/health`.
- Existing Docker behavior: backend healthcheck calls `http://localhost:3000/health`.
- Risk: backend container remains unhealthy, and frontend does not start because it depends on `backend.condition: service_healthy`.
- Recommended fix:
  - Either update Docker healthcheck to `/api/health`, or
  - Keep a compatibility alias at `/health`.
- Preferred direction: update `docker-compose.yml` to `/api/health` and ensure requirements/plans consistently reference the same healthcheck path.

### P1 — Frontend auth client ignores the configured backend URL

- File: `frontend/src/api/auth.ts:11`
- Related files:
  - `.env.example:22`
  - `frontend/vite.config.ts`
- Current behavior: auth client calls relative URLs such as `/api/auth/mock-login`.
- Existing configuration: `.env.example` defines `VITE_API_BASE_URL=http://localhost:3000`.
- Missing piece: Vite dev server has no `/api` proxy.
- Risk: in Docker/dev, the browser served from `:5173` sends auth requests to the frontend dev server instead of the backend. Mock login can fail outside mocked unit tests.
- Recommended fix options:
  - Use `VITE_API_BASE_URL` in the FE auth client, with CORS/session cookie settings aligned on the backend.
  - Or add a Vite `/api` proxy to the backend and keep relative URLs.
- Preferred direction: for local dev, add a Vite proxy for `/api` to avoid cross-origin cookie complexity. Revisit explicit API base handling when 6-5 FE-BE API contract and deployment topology are finalized.

### P2 — Missing `SESSION_SECRET` can silently fall back to a public secret

- File: `backend/src/index.ts:13-15`
- Current behavior: when `SESSION_SECRET` is missing, the server uses `dev-only-secret-change-in-prod`.
- Previous behavior: startup failed when required env vars were missing.
- Spec conflict: `requirements.md` treats `SESSION_SECRET` as required and states it should be a 32+ character random secret.
- Risk: staging/production can boot with a known session signing secret if env wiring is incomplete.
- Recommended fix:
  - Restore fail-fast validation for `SESSION_SECRET`, or
  - Gate the fallback strictly behind explicit local/development mode.
- Preferred direction: fail fast unless `NODE_ENV === 'development'` and `AUTH_MODE === 'mock'`.

### P2 — OIDC stub does not fail at boot as the approved plan says

- File: `backend/src/index.ts:6-7`
- Related files:
  - `backend/src/auth/index.ts:4-8`
  - `backend/src/auth/oidcAuth.ts:4-5`
  - `docs/specs/plans/phase6-6-auth-mock-design.md`
- Approved plan: `AUTH_MODE=oidc` is a stub that throws at boot time.
- Current behavior: `createAuthMiddleware()` returns `oidcAuthMiddleware`, but does not invoke it. Server can boot in `AUTH_MODE=oidc`.
- Risk: staging/production can appear healthy while OIDC auth is not implemented.
- Recommended fix:
  - Throw directly from `createAuthMiddleware()` for `AUTH_MODE=oidc` until real OIDC is implemented, or
  - Update the approved plan if booting with an unimplemented stub is intentional.
- Preferred direction: keep the approved plan and fail fast for `AUTH_MODE=oidc`.

## Verification Performed

Commands run during review:

```bash
npm test --workspace backend -- --runInBand | tail -20
npm test --workspace frontend -- --run | tail -20
npm run typecheck --workspace backend | tail -20
npm run typecheck --workspace frontend | tail -20
npm run build --workspace backend | tail -20
npm run build --workspace frontend | tail -20
```

Results:

- Backend tests: passed, 7 tests.
- Frontend tests: passed, 8 tests.
- Backend typecheck: passed.
- Frontend typecheck: passed.
- Backend build: passed.
- Frontend build: passed.

Note: frontend test run emitted a sandbox-only Vite websocket `EPERM` message, but tests completed successfully.

## Merge Recommendation

Do not merge until both P1 findings are fixed or explicitly accepted:

1. Healthcheck path must match the backend route.
2. Auth requests must reach the backend in local Docker/dev.

P2 findings can be fixed in the same PR with low implementation cost and should be addressed before staging use.
