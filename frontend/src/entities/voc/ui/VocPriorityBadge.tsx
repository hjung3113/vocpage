import { Flame, ChevronUp, Minus, ChevronDown, type LucideIcon } from 'lucide-react';
import type { VocPriority } from '@contracts/voc';
import { TextMark } from '@shared/ui/badge';

const PRIORITY_CONFIG: Record<
  VocPriority,
  { label: string; Icon: LucideIcon; color: string; weight: 400 | 500 | 600 | 700 }
> = {
  urgent: { label: 'Urgent', Icon: Flame, color: 'var(--status-red)', weight: 700 },
  high: { label: 'High', Icon: ChevronUp, color: 'var(--status-orange)', weight: 400 },
  medium: { label: 'Medium', Icon: Minus, color: 'var(--text-tertiary)', weight: 400 },
  low: { label: 'Low', Icon: ChevronDown, color: 'var(--text-quaternary)', weight: 400 },
};

export function VocPriorityBadge({ priority }: { priority: VocPriority }) {
  const { label, Icon, color, weight } = PRIORITY_CONFIG[priority];
  return (
    <TextMark
      variant={priority}
      iconMode="icon+text"
      icon={Icon}
      label={label}
      color={color}
      weight={weight}
      extraTestId={`priority-badge-${priority}`}
      ariaLabelOverride={`Priority ${label}`}
    />
  );
}
