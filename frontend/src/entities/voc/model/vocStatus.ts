import type { VocStatus } from '@contracts/voc';

export const VOC_STATUS_SLUG = {
  접수: 'received',
  검토중: 'reviewing',
  처리중: 'processing',
  완료: 'done',
  드랍: 'drop',
} as const satisfies Record<VocStatus, string>;
