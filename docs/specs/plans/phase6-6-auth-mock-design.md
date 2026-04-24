# Phase 6-6: Auth Mock Strategy Design

> Created: 2026-04-24
> Status: Approved — ready for implementation planning

## Summary

`AUTH_MODE=mock|oidc` environment variable controls the authentication strategy.
MVP implements only `mock` mode. `oidc` is a stub that throws at boot time.

---

## §1 File Structure & Middleware

```
backend/src/
  auth/
    index.ts        ← reads AUTH_MODE, exports correct middleware
    mockAuth.ts     ← mock session injection (MVP — fully implemented)
    oidcAuth.ts     ← OIDC JWT validation (MVP — throw stub)
    mockUsers.ts    ← fixture array (shared with seed script)
    types.ts        ← AuthUser type
```

### AuthUser type (`types.ts`)

```ts
interface AuthUser {
  id: string; // uuid — matches users.id in DB
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
}
```

### `index.ts` behavior

- `AUTH_MODE=mock` → export `mockAuth.ts` middleware
- `AUTH_MODE=oidc` → export `oidcAuth.ts` middleware
- Any other value → throw `Error` at startup (fail fast on misconfiguration)

### `mockAuth.ts` behavior

- `req.session.user` exists → attach to `req.user`, call `next()`
- No session → return `401` (FE global interceptor redirects to `/mock-login`)

### `oidcAuth.ts` MVP

```ts
export const oidcAuthMiddleware = (): never => {
  throw new Error('OIDC auth not implemented');
};
```

---

## §2 Mock Login Endpoints

### `POST /api/auth/mock-login`

- Body: `{ "role": "admin" | "manager" | "user" }`
- Returns `404` if `AUTH_MODE !== 'mock'` (never exposed in prod)
- Saves matching fixture user to `req.session.user`
- Response: `200 { user: AuthUser }`

### `POST /api/auth/logout`

- `req.session.destroy()` → clears session cookie
- Shared by mock and oidc modes

### `GET /api/auth/me`

- Passes through `validateADSession`
- Returns `req.user`
- Used by FE to restore current user on page refresh

### Session config

| Setting    | Value                                   |
| ---------- | --------------------------------------- |
| `httpOnly` | `true`                                  |
| `sameSite` | `'strict'`                              |
| `maxAge`   | 8 hours                                 |
| Dev store  | `MemoryStore` (express-session default) |

---

## §3 Mock User Fixtures

Stored in `backend/src/auth/mockUsers.ts`. Imported by both `mockAuth.ts` and the 6-7 seed script.

| role      | id (uuid)                              | email                 | name           |
| --------- | -------------------------------------- | --------------------- | -------------- |
| `admin`   | `00000000-0000-0000-0000-000000000001` | `admin@company.com`   | `Mock Admin`   |
| `manager` | `00000000-0000-0000-0000-000000000002` | `manager@company.com` | `Mock Manager` |
| `user`    | `00000000-0000-0000-0000-000000000003` | `user@company.com`    | `Mock User`    |

Fixed UUIDs allow test fixtures, seed data, and mock auth to all reference the same identifiers without magic strings.

**DB seed (Phase 6-7):** Insert all three rows into `users` using `INSERT ... ON CONFLICT DO NOTHING`. Idempotent — safe to re-run.

---

## §4 FE `/mock-login` Page

### Route registration

- Active only when `VITE_AUTH_MODE=mock`
- `VITE_AUTH_MODE=oidc`: direct navigation to `/mock-login` → redirect to `/`
- Component is lazy-loaded (dynamic import) → excluded from prod bundle via tree-shaking

### Page behavior

1. Dropdown with three options: Admin / Manager / User
2. "로그인" button → `POST /api/auth/mock-login { role }`
3. Success → redirect to originally requested path (or `/`)
4. Session expiry / 401 → FE global interceptor redirects to `/mock-login`

### Prod build isolation

`VITE_AUTH_MODE` is inlined at build time. The `mock` branch is tree-shaken out of the production bundle. Dynamic import ensures the mock-login chunk is never included in prod.

---

## §5 Environment Variables

| Variable         | Dev value | Prod value | Note                                           |
| ---------------- | --------- | ---------- | ---------------------------------------------- |
| `AUTH_MODE`      | `mock`    | `oidc`     | BE — controls middleware selection             |
| `VITE_AUTH_MODE` | `mock`    | `oidc`     | FE — controls route registration and API calls |

Both variables must be set consistently. Mismatch (BE=oidc + FE=mock) will cause login to fail silently.

---

## §6 Dependency on Phase 6-7

Mock auth is functional without a DB (middleware and session work in memory).
However, any write API that has `FK → users.id` requires the 3 seed rows to exist.

**Recommended order:**

1. Implement 6-6 (auth middleware + endpoints + FE page)
2. Smoke-test with `GET /api/auth/me` — no DB needed
3. Implement 6-7 (migrations + seed including mock user rows)
4. Full flow test with VOC create / comment (FK-dependent)
