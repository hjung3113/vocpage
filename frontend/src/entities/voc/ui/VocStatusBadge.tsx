import { Inbox, Eye, Loader2, CheckCircle2, CircleX, type LucideIcon } from 'lucide-react';
import type { VocStatus } from '@contracts/voc';
import { VOC_STATUS_SLUG } from '../model/vocStatus';
import { SolidChip, TextMark } from '@shared/ui/badge';

type StatusSlug = 'received' | 'reviewing' | 'processing' | 'done' | 'drop';

const STATUS_ICON_CONFIG: Record<StatusSlug, { Icon: LucideIcon; color: string }> = {
  received: { Icon: Inbox, color: 'var(--status-received-fg)' },
  reviewing: { Icon: Eye, color: 'var(--status-reviewing-fg)' },
  processing: { Icon: Loader2, color: 'var(--status-processing-fg)' },
  done: { Icon: CheckCircle2, color: 'var(--status-done-fg)' },
  drop: { Icon: CircleX, color: 'var(--status-drop-fg)' },
};

export function VocStatusBadge({
  status,
  iconOnly = false,
}: {
  status: VocStatus;
  iconOnly?: boolean;
}) {
  const slug = VOC_STATUS_SLUG[status];

  if (iconOnly) {
    const { Icon, color } = STATUS_ICON_CONFIG[slug];
    return (
      <TextMark
        variant={slug}
        iconMode="icon-only"
        icon={Icon}
        label={status}
        color={color}
        weight={400}
        extraTestId={`status-badge-${status}`}
        ariaLabelOverride={`상태 ${status}`}
      />
    );
  }

  return (
    <SolidChip
      variant={slug}
      label={status}
      extraTestId={`status-badge-${status}`}
      ariaLabelOverride={`상태 ${status}`}
    />
  );
}
