import type { NoticeListQuery } from '@contracts/notice';

type ListFilter = Partial<NoticeListQuery> | undefined;

export const noticeQueryKeys = {
  all: ['notice'] as const,
  lists: () => ['notice', 'list'] as const,
  list: (filter?: ListFilter) => ['notice', 'list', filter ?? {}] as const,
  detail: (id: string) => ['notice', 'detail', id] as const,
  popup: () => ['notice', 'popup'] as const,
} as const;
