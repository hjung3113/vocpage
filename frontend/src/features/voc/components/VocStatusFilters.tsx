import { Layers, Circle, Search, Zap, PauseCircle, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { VocStatus as VocStatusType } from '../../../../../shared/contracts/voc';

const STATUS_TOKEN: Record<VocStatusType, string> = {
  접수: 'var(--status-pending, var(--bg-info-subtle))',
  검토중: 'var(--status-review, var(--bg-warning-subtle))',
  처리중: 'var(--status-progress, var(--bg-info-subtle))',
  완료: 'var(--status-done, var(--bg-success-subtle))',
  드랍: 'var(--status-drop, var(--bg-muted))',
};

interface PillConfig {
  label: string;
  value: VocStatusType | 'all';
  icon: LucideIcon;
}

const PILLS: PillConfig[] = [
  { label: '전체', value: 'all', icon: Layers },
  { label: '접수', value: '접수', icon: Circle },
  { label: '검토중', value: '검토중', icon: Search },
  { label: '처리중', value: '처리중', icon: Zap },
  { label: '드랍', value: '드랍', icon: PauseCircle },
  { label: '완료', value: '완료', icon: CheckCircle2 },
];

export interface VocStatusFiltersProps {
  value: VocStatusType[] | 'all';
  onChange: (next: VocStatusType[] | 'all') => void;
}

export function VocStatusFilters({ value, onChange }: VocStatusFiltersProps) {
  const isAll = value === 'all';

  function handleClick(pill: VocStatusType | 'all') {
    if (pill === 'all') {
      onChange('all');
      return;
    }
    // current selected statuses
    const current: VocStatusType[] = isAll ? [] : (value as VocStatusType[]);
    const isSelected = current.includes(pill);
    if (isSelected) {
      // deselect
      onChange(current.filter((s) => s !== pill));
    } else {
      onChange([...current, pill]);
    }
  }

  function isPressed(pill: VocStatusType | 'all'): boolean {
    if (pill === 'all') return isAll;
    if (isAll) return false;
    return (value as VocStatusType[]).includes(pill);
  }

  return (
    <div
      className="flex items-center gap-2 flex-wrap px-6 py-3"
      style={{ borderBottom: '1px solid var(--border-standard)' }}
    >
      {PILLS.map(({ label, value: pillValue, icon: Icon }) => {
        const pressed = isPressed(pillValue);
        const statusBg =
          pillValue !== 'all' && pressed ? STATUS_TOKEN[pillValue as VocStatusType] : undefined;

        return (
          <button
            key={pillValue}
            type="button"
            role="button"
            aria-pressed={pressed}
            onClick={() => handleClick(pillValue)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors"
            style={{
              background: pressed ? (statusBg ?? 'var(--brand)') : 'var(--bg-elevated)',
              color: pressed
                ? pillValue === 'all'
                  ? 'var(--text-on-brand)'
                  : 'var(--text-primary)'
                : 'var(--text-secondary)',
              border: '1px solid var(--border-standard)',
            }}
          >
            <Icon size={13} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default VocStatusFilters;
