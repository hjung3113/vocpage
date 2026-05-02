import type { VocStatus } from '../../../shared/contracts/voc';

/** Maps Korean VocStatus enum → English slug used in CSS class names + design tokens. FE-only. */
export const VOC_STATUS_SLUG = {
  접수: 'received',
  검토중: 'reviewing',
  처리중: 'processing',
  완료: 'done',
  드랍: 'drop',
} as const satisfies Record<VocStatus, string>;
