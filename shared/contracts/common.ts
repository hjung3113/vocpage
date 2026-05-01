/**
 * @module shared/contracts/common
 *
 * Cross-tier contract module — types declared here are shared between the
 * frontend React SPA and the backend Express API.  This file must remain
 * environment-agnostic: no DOM, no Node.js, no framework imports allowed.
 */

export type SortDir = 'asc' | 'desc';

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Canonical role enum. Source of truth: requirements.md §2.3 D18 +
 * backend/src/auth/types.ts. Migration 012 adds `dev` to users.role.
 */
export type Role = 'user' | 'dev' | 'manager' | 'admin';

export interface RoleScopedColumns<TKey extends string = string> {
  readonly [role: string]: readonly TKey[];
}
