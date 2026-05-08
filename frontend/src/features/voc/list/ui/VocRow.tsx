import { ChevronRight } from 'lucide-react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { VocListResponse } from '@contracts/voc';
import { VOC_GRID_COLUMNS, VOC_GRID_PADDING_X } from './vocGridLayout';
import {
  VocStatusBadge,
  VocPriorityBadge,
  VocAssignee,
  VocTagPill,
  VocTypeBadge,
} from '@entities/voc';

type VocRowData = VocListResponse['rows'][number];

export interface VocTypeMapEntry {
  slug: string;
  name: string;
}

export interface VocRowProps {
  row: VocRowData;
  assigneeMap: Record<string, string>;
  vocTypeMap?: Record<string, VocTypeMapEntry>;
  selected?: boolean;
  onClick: () => void;
}

// Phase 3 follow-up: align with benchmark Tasks.html `.irow`
//   padding: 7px 24px; min-height: 36px; font-size: 13px; gap: 10px.
// Vertical padding (7px) replaces fixed 52px height; min-height keeps a
// stable row floor while letting tag chips relax growth.
const CONTAINER_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: VOC_GRID_COLUMNS,
  paddingTop: '7px',
  paddingBottom: '7px',
  paddingLeft: VOC_GRID_PADDING_X,
  paddingRight: VOC_GRID_PADDING_X,
  minHeight: '36px',
  alignItems: 'center',
  cursor: 'pointer',
  borderBottom: '1px solid var(--border-subtle)',
  fontSize: '13px',
};

export function VocRow({ row, assigneeMap, vocTypeMap, selected = false, onClick }: VocRowProps) {
  const vocType = vocTypeMap?.[row.voc_type_id];
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="row"
      data-testid="voc-row"
      className={selected ? 'voc-row is-selected' : 'voc-row'}
      style={CONTAINER_STYLE}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div role="presentation">
        <ChevronRight aria-hidden="true" className="voc-row-expand" />
      </div>

      <div role="gridcell" className="voc-row-issue-code">
        {row.issue_code}
      </div>

      <div role="gridcell" className="voc-row-title">
        {vocType && <VocTypeBadge slug={vocType.slug} name={vocType.name} iconOnly />}
        <span className="voc-title-text">{row.title}</span>
        {row.tags.length > 0 && (
          <div className="tag-row">
            {row.tags.map((tag) => (
              <VocTagPill key={tag} name={tag} />
            ))}
          </div>
        )}
      </div>

      <div role="gridcell">
        <VocStatusBadge status={row.status} iconOnly />
      </div>

      <div role="gridcell">
        <VocAssignee name={row.assignee_id ? (assigneeMap[row.assignee_id] ?? null) : null} />
      </div>

      <div role="gridcell">
        <VocPriorityBadge priority={row.priority} iconOnly />
      </div>

      <div role="gridcell" className="voc-row-created-at">
        {row.created_at.slice(0, 10)}
      </div>
    </div>
  );
}
