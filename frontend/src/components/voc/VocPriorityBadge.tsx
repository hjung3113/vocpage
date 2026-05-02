import { Flame, ChevronUp, Minus, ChevronDown, type LucideIcon } from 'lucide-react';
import type { VocPriority } from '../../../../shared/contracts/voc';

const PRIORITY_CONFIG: Record<
  VocPriority,
  { label: string; Icon: LucideIcon; iconName: string; weightClass: string }
> = {
  urgent: { label: 'Urgent', Icon: Flame, iconName: 'flame', weightClass: 'font-bold' },
  high: { label: 'High', Icon: ChevronUp, iconName: 'chevron-up', weightClass: 'font-semibold' },
  medium: { label: 'Medium', Icon: Minus, iconName: 'minus', weightClass: 'font-normal' },
  low: { label: 'Low', Icon: ChevronDown, iconName: 'chevron-down', weightClass: 'font-normal' },
};

export function VocPriorityBadge({ priority }: { priority: VocPriority }) {
  const { label, Icon, iconName, weightClass } = PRIORITY_CONFIG[priority];
  return (
    <span
      className={`priority-badge p-${priority} ${weightClass}`}
      data-testid={`priority-badge-${priority}`}
      aria-label={`Priority ${label}`}
    >
      <span className="priority-icon">
        <Icon size={12} className={`lucide-${iconName}`} aria-hidden="true" />
      </span>
      {label}
    </span>
  );
}
