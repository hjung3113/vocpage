import { ChevronRight } from 'lucide-react';
import type { CSSProperties, KeyboardEvent } from 'react';
import type { VocListResponse } from '../../../../shared/contracts/voc';
import { VOC_GRID_COLUMNS, VOC_GRID_PADDING_X } from './vocGridLayout';
import { VocStatusBadge } from './VocStatusBadge';
import { VocPriorityBadge } from './VocPriorityBadge';
import { VocAssignee } from './VocAssignee';
import { VocTagPill } from './VocTagPill';

type VocRowData = VocListResponse['rows'][number];

export interface VocRowProps {
  row: VocRowData;
  assigneeMap: Record<string, string>;
  selected?: boolean;
  onClick: () => void;
}

const CONTAINER_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: VOC_GRID_COLUMNS,
  padding: `0 ${VOC_GRID_PADDING_X}`,
  height: '52px',
  alignItems: 'center',
  cursor: 'pointer',
  borderBottom: '1px solid var(--border-subtle)',
};

export function VocRow({ row, assigneeMap, selected = false, onClick }: VocRowProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role="row"
      data-pcomp="voc-row"
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
        <VocStatusBadge status={row.status} />
      </div>

      <div role="gridcell">
        <VocAssignee name={row.assignee_id ? (assigneeMap[row.assignee_id] ?? null) : null} />
      </div>

      <div role="gridcell">
        <VocPriorityBadge priority={row.priority} />
      </div>

      <div role="gridcell" className="voc-row-created-at">
        {row.created_at.slice(0, 10)}
      </div>
    </div>
  );
}
