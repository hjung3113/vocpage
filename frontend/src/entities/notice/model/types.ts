/**
 * Re-export Notice contract types for convenience within entities/notice.
 * Source of truth: shared/contracts/notice.
 */
export type {
  Notice,
  NoticeImportance,
  NoticeCreate,
  NoticeUpdate,
  NoticeListQuery,
  NoticeListResponse,
  NoticePopupResponse,
} from '@contracts/notice';
