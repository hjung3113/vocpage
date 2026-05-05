import type { Role } from '@contracts/common';

export const notificationQueryKeys = {
  all: (role: Role) => ['notifications', role] as const,
  list: (role: Role) => ['notifications', role, 'list'] as const,
} as const;
