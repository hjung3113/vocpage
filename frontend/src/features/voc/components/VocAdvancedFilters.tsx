import { SlidersHorizontal, X } from 'lucide-react';
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
  assignees: AssigneeListItem[];
  tags: TagListItem[];
  vocTypes: VocTypeListItem[];
  value: VocAdvancedFiltersValue;
  onChange: (next: VocAdvancedFiltersValue) => void;
  onReset: () => void;
}

export interface VocAdvancedFiltersToggleProps {
  open: boolean;
  onToggle: () => void;
}

export function VocAdvancedFiltersToggle({ open, onToggle }: VocAdvancedFiltersToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="advanced-filters-toggle"
    >
      <SlidersHorizontal className="advanced-filters-toggle-icon" aria-hidden />
      필터 더보기
    </button>
  );
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
    <div role="group" aria-labelledby={labelId} className="advanced-filters-section">
      <span id={labelId} className="advanced-filters-section-label">
        {label}
      </span>
      <div className="advanced-filters-chips">
        {items.map((item) => {
          const pressed = (selected ?? []).includes(item.value);
          const chipClass = pressed
            ? 'advanced-filters-chip advanced-filters-chip--active'
            : 'advanced-filters-chip';
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={pressed}
              onClick={() => onToggleItem(toggleItem(selected, item.value))}
              className={chipClass}
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
  assignees,
  tags,
  vocTypes,
  value,
  onChange,
  onReset,
}: VocAdvancedFiltersProps) {
  return (
    <div
      data-pcomp="voc-advanced-filters"
      className={open ? 'advanced-filters advanced-filters--open' : 'advanced-filters'}
      aria-hidden={!open}
    >
      <div className="advanced-filters-grid-wrapper">
        {open && (
          <>
            <div className="advanced-filters-panel-header">
              <button type="button" onClick={onReset} className="advanced-filters-reset">
                <X className="advanced-filters-toggle-icon" aria-hidden />
                초기화
              </button>
            </div>
            <div className="advanced-filters-grid">
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
          </>
        )}
      </div>
    </div>
  );
}

export default VocAdvancedFilters;
