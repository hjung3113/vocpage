import type { VocStatus } from '../../../../shared/contracts/voc';
import { VOC_STATUS_SLUG } from '../../lib/voc-status-slug';

export function VocStatusBadge({ status }: { status: VocStatus }) {
  return (
    <span
      className={`status-badge s-${VOC_STATUS_SLUG[status]}`}
      data-testid={`status-badge-${status}`}
      aria-label={`상태 ${status}`}
    >
      <span className="status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
