import { Layers, Circle, Search, Zap, PauseCircle, CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { VocStatus as VocStatusType } from '@contracts/voc';
import { ToggleGroup, ToggleGroupItem } from '@shared/ui/toggle-group';

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
  rightSlot?: ReactNode;
}

export function VocStatusFilters({ value, onChange, rightSlot }: VocStatusFiltersProps) {
  const isAll = value === 'all';

  // Convert external value to ToggleGroup string[] format
  // 'all' → ['all'], specific statuses → [...statuses]
  const toggleValue: string[] = isAll ? ['all'] : (value as VocStatusType[]);

  function handleValueChange(vals: string[]) {
    // "all" toggled on → call onChange('all')
    if (vals.includes('all') && !toggleValue.includes('all')) {
      onChange('all');
      return;
    }
    // "all" was previously selected and user clicked a status item →
    // remove 'all' from the set, keep only the newly-selected status items
    const filtered = vals.filter((v) => v !== 'all');
    onChange(filtered as VocStatusType[]);
  }

  return (
    <div
      data-pcomp="voc-status-filters"
      className="flex items-center gap-2 flex-nowrap overflow-x-auto px-6 h-11 scrollbar-none"
      style={{
        background: 'var(--bg-app)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <ToggleGroup
        type="multiple"
        value={toggleValue}
        onValueChange={handleValueChange}
        className="flex items-center gap-2"
      >
        {PILLS.map(({ label, value: pillValue, icon: Icon }) => {
          const pressed =
            pillValue === 'all'
              ? isAll
              : !isAll && (value as VocStatusType[]).includes(pillValue as VocStatusType);
          const statusBg =
            pillValue !== 'all' && pressed ? STATUS_TOKEN[pillValue as VocStatusType] : undefined;

          return (
            <ToggleGroupItem
              key={pillValue}
              value={pillValue}
              data-testid={`status-chip-${pillValue}`}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors border"
              style={{
                background: pressed
                  ? pillValue === 'all'
                    ? 'var(--brand-bg, var(--brand))'
                    : (statusBg ?? 'var(--brand-bg, var(--brand))')
                  : 'var(--bg-elevated)',
                color: pressed ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <Icon size={13} aria-hidden />
              {label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
      {rightSlot && <div className="ml-auto flex items-center">{rightSlot}</div>}
    </div>
  );
}

export default VocStatusFilters;
