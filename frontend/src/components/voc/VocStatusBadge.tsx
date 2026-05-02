import { VOC_STATUS_SLUG, type VocStatus } from '../../../../shared/contracts/voc/entity';

export function VocStatusBadge({ status }: { status: VocStatus }) {
  return (
    <span
      className={`status-badge s-${VOC_STATUS_SLUG[status]}`}
      data-testid={`status-badge-${status}`}
    >
      <span className="status-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
