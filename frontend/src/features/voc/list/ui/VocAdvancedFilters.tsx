import { SlidersHorizontal, X } from 'lucide-react';
import type { AssigneeListItem, TagListItem, VocTypeListItem } from '@contracts/master/io';
import type { VocPriority } from '@contracts/voc/entity';
import { ToggleGroup, ToggleGroupItem } from '@shared/ui/toggle-group';

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

export const VOC_ADVANCED_FILTERS_PANEL_ID = 'voc-advanced-filters-panel';

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
      aria-controls={VOC_ADVANCED_FILTERS_PANEL_ID}
      className="advanced-filters-toggle"
      data-open={open}
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
    <div className="advanced-filters-section">
      <span id={labelId} className="advanced-filters-section-label">
        {label}
      </span>
      <ToggleGroup
        type="multiple"
        aria-labelledby={labelId}
        value={selected ?? []}
        onValueChange={(vals) => onToggleItem(vals as T[])}
        className="advanced-filters-chips"
      >
        {items.map((item) => (
          <ToggleGroupItem
            key={item.value}
            value={item.value}
            className={
              (selected ?? []).includes(item.value)
                ? 'advanced-filters-chip advanced-filters-chip--active'
                : 'advanced-filters-chip'
            }
          >
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
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
      id={VOC_ADVANCED_FILTERS_PANEL_ID}
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
