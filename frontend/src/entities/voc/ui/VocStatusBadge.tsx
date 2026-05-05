import type { VocStatus } from '@contracts/voc';
import { VOC_STATUS_SLUG } from '../model/vocStatus';
import { SolidChip } from '@shared/ui/badge';

export function VocStatusBadge({ status }: { status: VocStatus }) {
  const slug = VOC_STATUS_SLUG[status];
  return (
    <SolidChip
      variant={slug}
      label={status}
      extraTestId={`status-badge-${status}`}
      ariaLabelOverride={`상태 ${status}`}
    />
  );
}
