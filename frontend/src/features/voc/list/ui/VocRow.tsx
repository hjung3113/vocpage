import { ChevronRight } from 'lucide-react';
import type { CSSProperties, KeyboardEvent, MouseEvent } from 'react';
import type { VocListResponse } from '@contracts/voc';
import { VOC_GRID_COLUMNS, VOC_GRID_PADDING_X } from './vocGridLayout';
import {
  VocStatusBadge,
  VocPriorityBadge,
  VocAssignee,
  VocTagPill,
} from '@entities/voc';
import { IssueId } from '@shared/ui/issue-id';

type VocRowData = VocListResponse['rows'][number];

export interface VocRowProps {
  row: VocRowData;
  assigneeMap: Record<string, string>;
  selected?: boolean;
  onClick: () => void;
  /** Spec §9.2.2: parent rows expose ▶/▼ toggle when subtasks exist. */
  hasChildren?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  /** Spec §9.2.2: child row indents issue_code by 24px to convey hierarchy. */
  indented?: boolean;
}

// Phase 3 follow-up: align with benchmark Tasks.html `.irow`
//   padding: 7px 24px; min-height: 36px; font-size: 13px; gap: 10px.
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

export function VocRow({
  row,
  assigneeMap,
  selected = false,
  onClick,
  hasChildren = false,
  expanded = false,
  onToggleExpand,
  indented = false,
}: VocRowProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleExpand?.();
  };

  return (
    <div
      role="row"
      data-testid="voc-row"
      data-child={indented ? 'true' : undefined}
      aria-expanded={hasChildren ? expanded : undefined}
      className={selected ? 'voc-row is-selected' : 'voc-row'}
      style={CONTAINER_STYLE}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div role="presentation">
        {hasChildren && onToggleExpand ? (
          <button
            type="button"
            data-testid="voc-row-expand-toggle"
            aria-label={expanded ? '서브태스크 접기' : '서브태스크 펼치기'}
            aria-expanded={expanded}
            onClick={handleToggle}
            className="voc-row-expand-button"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-tertiary)',
            }}
          >
            <ChevronRight
              aria-hidden="true"
              className="voc-row-expand"
              width={14}
              height={14}
              style={{
                transition: 'transform 120ms ease',
                transform: expanded ? 'rotate(90deg)' : 'none',
              }}
            />
          </button>
        ) : (
          <span aria-hidden="true" style={{ display: 'inline-block', width: '16px' }} />
        )}
      </div>

      <div
        role="gridcell"
        className="voc-row-issue-code"
        style={indented ? { paddingLeft: '24px' } : undefined}
      >
        <IssueId id={row.issue_code} tone={indented ? 'subdued' : 'default'} />
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
