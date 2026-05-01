import type { VocStatus } from '../../../../shared/contracts/voc';

const TOKEN: Record<VocStatus, string> = {
  접수: 'var(--status-pending, var(--bg-info-subtle))',
  검토중: 'var(--status-review, var(--bg-warning-subtle))',
  처리중: 'var(--status-progress, var(--bg-info-subtle))',
  완료: 'var(--status-done, var(--bg-success-subtle))',
  드랍: 'var(--status-drop, var(--bg-muted))',
};

export function VocStatusBadge({ status }: { status: VocStatus }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: TOKEN[status], color: 'var(--text-primary)' }}
      data-testid={`status-badge-${status}`}
    >
      {status}
    </span>
  );
}
