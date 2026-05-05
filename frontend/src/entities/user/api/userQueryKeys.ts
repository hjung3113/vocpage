import type { Role } from '@contracts/common';

type Filter = Record<string, unknown> | undefined;

export const userQueryKeys = {
  all: (role: Role) => ['users', role] as const,
  list: (role: Role, filter?: Filter) => ['users', role, 'list', filter ?? {}] as const,
  detail: (role: Role, id: string) => ['users', role, 'detail', id] as const,
} as const;
