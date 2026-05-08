/**
 * Re-export FAQ contract types for convenience within entities/faq.
 * Source of truth: shared/contracts/faq.
 */
export type {
  Faq,
  FaqCategory,
  FaqCreate,
  FaqUpdate,
  FaqListQuery,
  FaqListResponse,
  FaqCategoryListResponse,
  FaqCategoryCreate,
  FaqCategoryUpdate,
} from '@contracts/faq';
