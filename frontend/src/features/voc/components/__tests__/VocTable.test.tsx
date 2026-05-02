import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VocTable } from '../VocTable';
import type { VocListResponse, VocSortColumn } from '../../../../../../shared/contracts/voc';

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
  tags: [] as string[],
};

const rows: VocListResponse['rows'] = [
  {
    id: 'row-1',
    issue_code: 'VOC-001',
    title: '첫 번째 VOC',
    status: '접수',
    priority: 'high',
    assignee_id: 'user-123',
    created_at: '2026-05-01T10:00:00Z',
    ...COMMON_FIELDS,
  },
  {
    id: 'row-2',
    issue_code: 'VOC-002',
    title: '두 번째 VOC',
    status: '검토중',
    priority: 'medium',
    assignee_id: null,
    created_at: '2026-05-02T10:00:00Z',
    ...COMMON_FIELDS,
  },
];

const assigneeMap: Record<string, string> = {
  'user-123': '김담당',
};

describe('VocTable', () => {
  it('renders 6 columnheaders in order: 이슈 ID, 제목, 상태, 담당자, 우선순위, 등록일', () => {
    render(
      <VocTable
        rows={rows}
        sortBy="created_at"
        sortDir="desc"
        onSort={vi.fn()}
        onRowClick={vi.fn()}
        assigneeMap={assigneeMap}
      />,
    );
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(6);
    expect(headers[0]).toHaveTextContent('이슈 ID');
    expect(headers[1]).toHaveTextContent('제목');
    expect(headers[2]).toHaveTextContent('상태');
    expect(headers[3]).toHaveTextContent('담당자');
    expect(headers[4]).toHaveTextContent('우선순위');
    expect(headers[5]).toHaveTextContent('등록일');
  });

  it('renders 6 gridcells per row', () => {
    render(
      <VocTable
        rows={[rows[0]!]}
        sortBy="created_at"
        sortDir="desc"
        onSort={vi.fn()}
        onRowClick={vi.fn()}
        assigneeMap={assigneeMap}
      />,
    );
    const cells = screen.getAllByRole('gridcell');
    expect(cells).toHaveLength(6);
  });

  it('renders unassigned VocAssignee when assignee_id is null', () => {
    render(
      <VocTable
        rows={rows}
        sortBy="created_at"
        sortDir="desc"
        onSort={vi.fn()}
        onRowClick={vi.fn()}
        assigneeMap={assigneeMap}
      />,
    );
    expect(screen.getAllByTestId('assignee-unassigned').length).toBeGreaterThan(0);
  });

  it('sets aria-sort="descending" on priority header when sortBy="priority" and sortDir="desc"', () => {
    render(
      <VocTable
        rows={rows}
        sortBy={'priority' as VocSortColumn}
        sortDir="desc"
        onSort={vi.fn()}
        onRowClick={vi.fn()}
        assigneeMap={assigneeMap}
      />,
    );
    const priorityHeader = screen.getByRole('columnheader', { name: /우선순위/ });
    expect(priorityHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it('container has role="grid" and aria-label', () => {
    render(
      <VocTable
        rows={rows}
        sortBy="created_at"
        sortDir="desc"
        onSort={vi.fn()}
        onRowClick={vi.fn()}
        assigneeMap={assigneeMap}
      />,
    );
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-label', 'VOC 목록');
  });

  it('renders empty state when rows is empty (outside grid)', () => {
    render(
      <VocTable
        rows={[]}
        sortBy="created_at"
        sortDir="desc"
        onSort={vi.fn()}
        onRowClick={vi.fn()}
        assigneeMap={assigneeMap}
      />,
    );
    expect(screen.getByTestId('voc-table-empty')).toHaveTextContent('데이터가 없습니다');
    // Empty state is NOT inside role=grid (no rows means just the header inside grid)
    const grid = screen.getByRole('grid');
    expect(grid).not.toContainElement(screen.getByTestId('voc-table-empty'));
  });

  it('calls onRowClick with row id when row is clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <VocTable
        rows={rows}
        sortBy="created_at"
        sortDir="desc"
        onSort={vi.fn()}
        onRowClick={onRowClick}
        assigneeMap={assigneeMap}
      />,
    );
    await user.click(screen.getByText('첫 번째 VOC'));
    expect(onRowClick).toHaveBeenCalledWith('row-1');
  });
});
