import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { VocTable } from '../ui/VocTable';
import type { VocListResponse } from '@contracts/voc';

const COMMON = {
  voc_type_id: 'vtype-001',
  system_id: 'sys-001',
  menu_id: 'menu-001',
  author_id: 'author-001',
  source: 'manual' as const,
  due_date: null,
  updated_at: '2026-05-01T10:00:00Z',
  notes_count: 0,
  tags: [] as string[],
};

const parentRow: VocListResponse['rows'][number] = {
  id: 'parent-1',
  issue_code: 'VOC-100',
  title: '부모 VOC',
  status: '검토중',
  priority: 'high',
  assignee_id: 'user-123',
  created_at: '2026-05-01T10:00:00Z',
  parent_id: null,
  has_children: true,
  ...COMMON,
};

const childRow: VocListResponse['rows'][number] = {
  id: 'child-1',
  issue_code: 'VOC-100-1',
  title: '자식 서브태스크',
  status: '처리중',
  priority: 'low',
  assignee_id: null,
  created_at: '2026-05-02T10:00:00Z',
  parent_id: 'parent-1',
  has_children: false,
  ...COMMON,
};

const orphanRow: VocListResponse['rows'][number] = {
  ...parentRow,
  id: 'orphan-1',
  issue_code: 'VOC-200',
  title: '단독 VOC',
  has_children: false,
};

const assigneeMap: Record<string, string> = { 'user-123': '김담당' };

function renderTable(props: Partial<Parameters<typeof VocTable>[0]> = {}) {
  return render(
    <VocTable
      rows={[parentRow, childRow]}
      sortBy="created_at"
      sortDir="desc"
      onSort={vi.fn()}
      onRowClick={vi.fn()}
      assigneeMap={assigneeMap}
      {...props}
    />,
  );
}

describe('VocTable §9.2.2 inline subtask expand', () => {
  it('자식 row 는 기본적으로 숨김 (부모만 노출)', () => {
    renderTable();
    expect(screen.getByText('부모 VOC')).toBeInTheDocument();
    expect(screen.queryByText('자식 서브태스크')).not.toBeInTheDocument();
  });

  it('▶ 토글 클릭 시 자식 인라인 펼침, 재클릭 시 접힘', async () => {
    const user = userEvent.setup();
    renderTable();
    const toggle = screen.getByTestId('voc-row-expand-toggle');
    await user.click(toggle);
    expect(screen.getByText('자식 서브태스크')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(screen.queryByText('자식 서브태스크')).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('토글 클릭은 부모 행 클릭으로 버블링되지 않음', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    renderTable({ onRowClick });
    await user.click(screen.getByTestId('voc-row-expand-toggle'));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it('자식 행 클릭 시 onRowClick(child id)', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    renderTable({ onRowClick });
    await user.click(screen.getByTestId('voc-row-expand-toggle'));
    await user.click(screen.getByText('자식 서브태스크'));
    expect(onRowClick).toHaveBeenCalledWith('child-1');
  });

  it('has_children=false 인 부모는 토글 버튼 비노출', () => {
    renderTable({ rows: [orphanRow] });
    expect(screen.queryByTestId('voc-row-expand-toggle')).not.toBeInTheDocument();
  });

  it('groupByStatus 활성: 자식은 부모 status 그룹 안에 인라인', async () => {
    const user = userEvent.setup();
    renderTable({ groupByStatus: true });
    expect(screen.queryByText(/^처리중$/)).not.toBeInTheDocument();
    await user.click(screen.getByTestId('voc-row-expand-toggle'));
    expect(screen.getByText('자식 서브태스크')).toBeInTheDocument();
  });
});
