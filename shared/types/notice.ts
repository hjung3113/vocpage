/**
 * @module shared/types/notice
 *
 * TS aliases re-exported from the zod contracts so consumers that don't need
 * runtime parsing can import types only. Zod schemas: shared/contracts/notice.
 */
export type {
  Notice,
  NoticeListItem,
  NoticeImportance,
  NoticeListQuery,
  NoticeListResponse,
  NoticeCreate,
  NoticeUpdate,
  NoticeDetail,
  NoticeIdParam,
  NoticePopupResponse,
} from '../contracts/notice';
