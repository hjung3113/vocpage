import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VocRow } from '../ui/VocRow';
import type { VocListResponse } from '@contracts/voc';

type VocRowData = VocListResponse['rows'][number];

const COMMON_FIELDS = {
  voc_type_id: 'vtype-001',
  system_id: 'sys-001',
  menu_id: 'menu-001',
  author_id: 'author-001',
  parent_id: null,
  source: 'manual' as const,
  due_date: null,
  updated_at: '2026-05-01T10:00:00Z',
  has_children: false,
  notes_count: 0,
};

const row: VocRowData = {
  id: 'row-1',
  issue_code: 'VOC-001',
  title: '첫 번째 VOC',
  status: '접수',
  priority: 'high',
  assignee_id: 'user-123',
  created_at: '2026-05-01T10:00:00Z',
  tags: ['버그', '긴급'],
  ...COMMON_FIELDS,
};

const unassignedRow: VocRowData = {
  ...row,
  id: 'row-2',
  assignee_id: null,
};

const noTagsRow: VocRowData = {
  ...row,
  id: 'row-3',
  tags: [],
};

const assigneeMap: Record<string, string> = {
  'user-123': '김담당',
};

describe('VocRow', () => {
  it('renders role="row" with data-testid="voc-row"', () => {
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={() => {}} />);
    const el = screen.getByTestId('voc-row');
    expect(el).toHaveAttribute('role', 'row');
    expect(el).toHaveAttribute('data-testid', 'voc-row');
  });

  it('renders 6 gridcells (issue_code/title/status/assignee/priority/created_at)', () => {
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={() => {}} />);
    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(6);
  });

  it('expand cell has role="presentation"', () => {
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={() => {}} />);
    const presentation = screen.getAllByRole('presentation');
    expect(presentation.length).toBeGreaterThan(0);
  });

  it('clicking row invokes onClick', () => {
    const onClick = vi.fn();
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('voc-row'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is-selected class applied when selected=true', () => {
    render(<VocRow row={row} assigneeMap={assigneeMap} selected={true} onClick={() => {}} />);
    expect(screen.getByTestId('voc-row').className).toContain('is-selected');
  });

  it('no is-selected class when selected=false', () => {
    render(<VocRow row={row} assigneeMap={assigneeMap} selected={false} onClick={() => {}} />);
    expect(screen.getByTestId('voc-row').className).not.toContain('is-selected');
  });

  it('created_at trimmed to YYYY-MM-DD', () => {
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={() => {}} />);
    expect(screen.getByText('2026-05-01')).toBeInTheDocument();
  });

  it('issue_code text rendered', () => {
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={() => {}} />);
    expect(screen.getByText('VOC-001')).toBeInTheDocument();
  });

  it('title text rendered', () => {
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={() => {}} />);
    expect(screen.getByText('첫 번째 VOC')).toBeInTheDocument();
  });

  it('renders unassigned VocAssignee when assignee_id is null', () => {
    render(<VocRow row={unassignedRow} assigneeMap={assigneeMap} onClick={() => {}} />);
    expect(screen.getByTestId('assignee-unassigned')).toBeInTheDocument();
  });

  it('assignee name resolved from assigneeMap', () => {
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={() => {}} />);
    expect(screen.getByText('김담당')).toBeInTheDocument();
  });

  it('component source has no hex or raw oklch', () => {
    const src = readFileSync(resolve(__dirname, '..', 'ui', 'VocRow.tsx'), 'utf-8');
    expect(src).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(src).not.toMatch(/oklch\s*\(/i);
  });

  it('C-7 CSS block (between START/END markers) has no hex or raw oklch', () => {
    const css = readFileSync(
      resolve(__dirname, '..', '..', '..', '..', 'shared', 'styles', 'globals.css'),
      'utf-8',
    );
    const start = css.indexOf('=== C-7 VocRow styles START ===');
    const end = css.indexOf('=== C-7 VocRow styles END ===');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const block = css.slice(start, end);
    expect(block).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(block).not.toMatch(/oklch\s*\(/i);
  });

  it('Phase 3 follow-up: row container uses min-height 36px and padding 7px 24px (Tasks.html .irow parity)', () => {
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={() => {}} />);
    const el = screen.getByTestId('voc-row') as HTMLDivElement;
    expect(el.style.minHeight).toBe('36px');
    // Vertical padding = 7px, horizontal padding inherits VOC_GRID_PADDING_X token.
    expect(el.style.paddingTop).toBe('7px');
    expect(el.style.paddingBottom).toBe('7px');
    // Hardcoded fixed height removed (was 52px).
    expect(el.style.height).toBe('');
  });

  it('keyboard Enter triggers onClick', () => {
    const onClick = vi.fn();
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={onClick} />);
    fireEvent.keyDown(screen.getByTestId('voc-row'), { key: 'Enter' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keyboard Space triggers onClick', () => {
    const onClick = vi.fn();
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={onClick} />);
    fireEvent.keyDown(screen.getByTestId('voc-row'), { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a VocTagPill for each tag inside .tag-row', () => {
    const { container } = render(<VocRow row={row} assigneeMap={assigneeMap} onClick={() => {}} />);
    const tagRow = container.querySelector('.tag-row');
    expect(tagRow).not.toBeNull();
    const pills = screen.getAllByTestId('voc-tag-pill');
    expect(pills).toHaveLength(2);
    expect(pills[0]).toHaveAttribute('data-tag-name', '버그');
    expect(pills[1]).toHaveAttribute('data-tag-name', '긴급');
  });

  it('omits .tag-row when tags array is empty', () => {
    const { container } = render(
      <VocRow row={noTagsRow} assigneeMap={assigneeMap} onClick={() => {}} />,
    );
    expect(container.querySelector('.tag-row')).toBeNull();
    expect(screen.queryAllByTestId('voc-tag-pill')).toHaveLength(0);
  });

  it('Flowline C-extension: title cell does not prepend a VocTypeBadge (type info lives in detail/drawer)', () => {
    render(<VocRow row={row} assigneeMap={assigneeMap} onClick={() => {}} />);
    expect(screen.queryByTestId('voc-type-badge-bug')).toBeNull();
    expect(screen.queryByTestId('text-mark-unknown')).toBeNull();
  });
});
