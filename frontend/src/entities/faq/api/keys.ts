import type { FaqListQuery } from '@contracts/faq';

type ListFilter = Partial<FaqListQuery> | undefined;

export const faqQueryKeys = {
  all: ['faq'] as const,
  lists: () => ['faq', 'list'] as const,
  list: (filter?: ListFilter) => ['faq', 'list', filter ?? {}] as const,
  detail: (id: string) => ['faq', 'detail', id] as const,
  search: (q: string) => ['faq', 'list', { q }] as const,
  categories: () => ['faq', 'categories'] as const,
} as const;
