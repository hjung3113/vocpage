import type { Role } from '@contracts/common';

type Filter = Record<string, unknown> | undefined;

export const vocQueryKeys = {
  all: (role: Role) => ['voc', role] as const,
  list: (role: Role, filter?: Filter) => ['voc', role, 'list', filter ?? {}] as const,
  detail: (role: Role, id: string) => ['voc', role, 'detail', id] as const,
  notes: (role: Role, id: string) => ['voc', role, 'notes', id] as const,
  history: (role: Role, id: string) => ['voc', role, 'history', id] as const,
} as const;
