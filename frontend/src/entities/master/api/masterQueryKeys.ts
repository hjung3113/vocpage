import type { Role } from '@contracts/common';

export const masterQueryKeys = {
  tags: {
    all: (role: Role) => ['tags', role] as const,
    list: (role: Role) => ['tags', role, 'list'] as const,
  },
  external: {
    all: (role: Role) => ['external', role] as const,
    list: (role: Role, filter?: Record<string, unknown>) =>
      ['external', role, 'list', filter ?? {}] as const,
  },
} as const;
