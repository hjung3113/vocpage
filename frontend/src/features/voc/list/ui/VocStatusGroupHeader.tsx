import type { VocStatus } from '@contracts/voc';
import { VocStatusBadge } from '@entities/voc';
import { ListGroupHeader } from '@shared/ui/list-group-header';

export interface VocStatusGroupHeaderProps {
  status: VocStatus;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}

// Wave C-extension: domain wrapper around `ListGroupHeader` (uidesign.md §16.6).
// Visual contract identical to prior inline implementation; legacy `voc-*` testids
// preserved for back-compat with consumers in `widgets/voc-workspace` integrations.
export function VocStatusGroupHeader({
  status,
  count,
  collapsed,
  onToggle,
}: VocStatusGroupHeaderProps) {
  return (
    <ListGroupHeader
      collapsed={collapsed}
      onToggle={onToggle}
      testId={`voc-status-group-header-${status}`}
    >
      <VocStatusBadge status={status} iconOnly />
      <span>{status}</span>
      <span
        data-testid="voc-status-group-count"
        style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          fontWeight: 500,
        }}
      >
        {count}
      </span>
    </ListGroupHeader>
  );
}
