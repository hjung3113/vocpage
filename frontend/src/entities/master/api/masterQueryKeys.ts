import type { Role } from '@contracts/common';

type Filter = Record<string, unknown> | undefined;

export const masterQueryKeys = {
  tags: {
    all: (role: Role) => ['tags', role] as const,
    list: (role: Role) => ['tags', role, 'list'] as const,
  },
  external: {
    all: (role: Role) => ['external', role] as const,
    list: (role: Role, filter?: Filter) => ['external', role, 'list', filter ?? {}] as const,
  },
  assignees: {
    all: (role: Role) => ['masters', 'assignees', role] as const,
    list: (role: Role) => ['masters', 'assignees', role, 'list'] as const,
  },
  vocTypes: {
    all: (role: Role) => ['masters', 'voc-types', role] as const,
    list: (role: Role) => ['masters', 'voc-types', role, 'list'] as const,
  },
} as const;
