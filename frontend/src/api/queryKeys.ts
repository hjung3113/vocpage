/**
 * Centralised TanStack Query key factory.
 *
 * Convention: ['<domain>', role, ...filters]
 *
 * `role` is the user's currently active role. Including it in every key means
 * switching role automatically yields a fresh cache key — no manual
 * invalidation required for role-scoped data.
 *
 * MIGRATION: FSD Step 3 seeded per-entity query-key files (entities/voc/api/vocQueryKeys etc).
 * Step 4 will migrate callers. Do not add new domains here.
 */
import type { Role } from '../../../shared/contracts/common';

type Filter = Record<string, unknown> | undefined;

export const queryKeys = {
  voc: {
    all: (role: Role) => ['voc', role] as const,
    list: (role: Role, filter?: Filter) => ['voc', role, 'list', filter ?? {}] as const,
    detail: (role: Role, id: string) => ['voc', role, 'detail', id] as const,
    notes: (role: Role, id: string) => ['voc', role, 'notes', id] as const,
    history: (role: Role, id: string) => ['voc', role, 'history', id] as const,
  },
  dashboard: {
    all: (role: Role) => ['dashboard', role] as const,
    summary: (role: Role, filter?: Filter) => ['dashboard', role, 'summary', filter ?? {}] as const,
  },
  notice: {
    all: (role: Role) => ['notice', role] as const,
    list: (role: Role, filter?: Filter) => ['notice', role, 'list', filter ?? {}] as const,
    detail: (role: Role, id: string) => ['notice', role, 'detail', id] as const,
  },
  faq: {
    all: (role: Role) => ['faq', role] as const,
    list: (role: Role, filter?: Filter) => ['faq', role, 'list', filter ?? {}] as const,
    detail: (role: Role, id: string) => ['faq', role, 'detail', id] as const,
  },
  tags: {
    all: (role: Role) => ['tags', role] as const,
    list: (role: Role) => ['tags', role, 'list'] as const,
  },
  external: {
    all: (role: Role) => ['external', role] as const,
    list: (role: Role, filter?: Filter) => ['external', role, 'list', filter ?? {}] as const,
  },
  users: {
    all: (role: Role) => ['users', role] as const,
    list: (role: Role, filter?: Filter) => ['users', role, 'list', filter ?? {}] as const,
    detail: (role: Role, id: string) => ['users', role, 'detail', id] as const,
  },
  notifications: {
    all: (role: Role) => ['notifications', role] as const,
    list: (role: Role) => ['notifications', role, 'list'] as const,
  },
  health: {
    all: () => ['health'] as const,
  },
} as const;
