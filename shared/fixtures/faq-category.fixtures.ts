/**
 * @module shared/fixtures/faq-category.fixtures
 *
 * Deterministic FAQ category fixtures.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.4.4.
 */
import { FaqCategory, type FaqCategory as FaqCategoryT } from '../contracts/faq';

export const FAQ_CATEGORY_FIXTURES: ReadonlyArray<FaqCategoryT> = [
  FaqCategory.parse({
    id: '22222222-cccc-4ccc-8ccc-000000000001',
    name: '계정·로그인',
    slug: 'account',
    sort_order: 1,
    is_archived: false,
  }),
  FaqCategory.parse({
    id: '22222222-cccc-4ccc-8ccc-000000000002',
    name: 'VOC 등록',
    slug: 'voc-create',
    sort_order: 2,
    is_archived: false,
  }),
  FaqCategory.parse({
    id: '22222222-cccc-4ccc-8ccc-000000000003',
    name: '권한·역할',
    slug: 'permissions',
    sort_order: 3,
    is_archived: false,
  }),
];
