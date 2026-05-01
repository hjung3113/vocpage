import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import type {
  AssigneeListItem,
  TagListItem,
  VocTypeListItem,
} from '../../../../../shared/contracts/master/io';
import type { VocPriority } from '../../../../../shared/contracts/voc/entity';

export interface VocAdvancedFiltersValue {
  assignees?: string[];
  priorities?: VocPriority[];
  voc_type_ids?: string[];
  tag_ids?: string[];
}

export interface VocAdvancedFiltersProps {
  open: boolean;
  onToggle: () => void;
  assignees: AssigneeListItem[];
  tags: TagListItem[];
  vocTypes: VocTypeListItem[];
  value: VocAdvancedFiltersValue;
  onChange: (next: VocAdvancedFiltersValue) => void;
  onReset: () => void;
}

const PRIORITIES: ReadonlyArray<{ value: VocPriority; label: string }> = [
  { value: 'urgent', label: '긴급' },
  { value: 'high', label: '높음' },
  { value: 'medium', label: '보통' },
  { value: 'low', label: '낮음' },
];

function toggleItem<T>(list: T[] | undefined, item: T): T[] {
  const arr = list ?? [];
  return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];
}

interface ChipGroupProps<T extends string> {
  groupId: string;
  label: string;
  items: ReadonlyArray<{ value: T; label: string }>;
  selected: T[] | undefined;
  onToggleItem: (next: T[]) => void;
}

function ChipGroup<T extends string>({
  groupId,
  label,
  items,
  selected,
  onToggleItem,
}: ChipGroupProps<T>) {
  const labelId = `${groupId}-label`;
  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <span id={labelId} className="text-xs text-[color:var(--text-secondary)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const pressed = (selected ?? []).includes(item.value);
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={pressed}
              onClick={() => onToggleItem(toggleItem(selected, item.value))}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors',
                pressed
                  ? 'border-[color:var(--brand)] bg-[color:var(--brand)] text-[color:var(--text-on-brand)]'
                  : 'border-[color:var(--border-standard)] bg-[color:var(--bg-elevated)] text-[color:var(--text-primary)] hover:border-[color:var(--brand)]',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function VocAdvancedFilters({
  open,
  onToggle,
  assignees,
  tags,
  vocTypes,
  value,
  onChange,
  onReset,
}: VocAdvancedFiltersProps) {
  return (
    <div data-pcomp="voc-advanced-filters" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggle}
          aria-expanded={open}
          className="border-[color:var(--border-standard)] text-[color:var(--text-secondary)]"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          필터 더보기
        </Button>
        {open && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-[color:var(--text-secondary)]"
          >
            <X className="mr-1 h-4 w-4" />
            초기화
          </Button>
        )}
      </div>
      {open && (
        <div className="grid gap-4 rounded-md border border-[color:var(--border-standard)] bg-[color:var(--bg-elevated)] p-4 sm:grid-cols-2">
          <ChipGroup
            groupId="adv-assignees"
            label="담당자"
            items={assignees.map((a) => ({ value: a.id, label: a.display_name }))}
            selected={value.assignees}
            onToggleItem={(next) => onChange({ ...value, assignees: next })}
          />
          <ChipGroup
            groupId="adv-priorities"
            label="우선순위"
            items={PRIORITIES}
            selected={value.priorities}
            onToggleItem={(next) => onChange({ ...value, priorities: next as VocPriority[] })}
          />
          <ChipGroup
            groupId="adv-voc-types"
            label="유형"
            items={vocTypes.map((t) => ({ value: t.id, label: t.name }))}
            selected={value.voc_type_ids}
            onToggleItem={(next) => onChange({ ...value, voc_type_ids: next })}
          />
          <ChipGroup
            groupId="adv-tags"
            label="태그"
            items={tags.map((t) => ({ value: t.id, label: t.name }))}
            selected={value.tag_ids}
            onToggleItem={(next) => onChange({ ...value, tag_ids: next })}
          />
        </div>
      )}
    </div>
  );
}

export default VocAdvancedFilters;
