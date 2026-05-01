/**
 * @module shared/contracts/common
 *
 * Cross-tier contract module — types declared here are shared between the
 * frontend React SPA and the backend Express API.  This file must remain
 * environment-agnostic: no DOM, no Node.js, no framework imports allowed.
 * Zod schemas will wrap these types in Wave 1 once the zod dependency lands.
 */

export type SortDir = 'asc' | 'desc';

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export type Role = 'reporter' | 'reviewer' | 'admin' | 'dev';

export interface RoleScopedColumns<TKey extends string = string> {
  readonly [role: string]: readonly TKey[];
}
