import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VocReviewMetaPanel } from '../VocReviewMetaPanel';
import { VOC_FIXTURES, FIXTURE_USERS } from '../../../../../../shared/fixtures/voc.fixtures';

const baseVoc = VOC_FIXTURES.find((r) => r.deleted_at === null)!;

const assigneeMap: Record<string, string> = {
  [FIXTURE_USERS.manager]: '홍길동',
  [FIXTURE_USERS.admin]: '관리자',
};

const vocTypeMap: Record<string, { slug: string; name: string }> = {
  '55555555-5555-4555-8555-555555555555': { slug: 'bug', name: '버그' },
};

describe('VocReviewMetaPanel', () => {
  it('기본 렌더링 — 8개 메타 필드(created_at/status/priority/type/assignee/due_date/system/menu) 모두 표시', () => {
    render(<VocReviewMetaPanel voc={baseVoc} assigneeMap={assigneeMap} vocTypeMap={vocTypeMap} />);
    expect(screen.getByTestId('voc-meta-panel')).toBeInTheDocument();
    expect(screen.getByTestId('meta-created_at')).toBeInTheDocument();
    expect(screen.getByTestId('meta-status')).toBeInTheDocument();
    expect(screen.getByTestId('meta-priority')).toBeInTheDocument();
    expect(screen.getByTestId('meta-type')).toBeInTheDocument();
    expect(screen.getByTestId('meta-assignee')).toBeInTheDocument();
    expect(screen.getByTestId('meta-due_date')).toBeInTheDocument();
    expect(screen.getByTestId('meta-system')).toBeInTheDocument();
    expect(screen.getByTestId('meta-menu')).toBeInTheDocument();
  });

  it('등록일 필드가 created_at 날짜(YYYY-MM-DD)로 표시됨', () => {
    render(<VocReviewMetaPanel voc={baseVoc} assigneeMap={assigneeMap} />);
    expect(screen.getByTestId('meta-created_at')).toHaveTextContent(
      baseVoc.created_at.slice(0, 10),
    );
  });

  it('due_date === null → "—" 표시', () => {
    const voc = { ...baseVoc, due_date: null };
    render(<VocReviewMetaPanel voc={voc} assigneeMap={assigneeMap} />);
    expect(screen.getByTestId('meta-due_date')).toHaveTextContent('—');
  });

  it('vocTypeMap 미제공 → type row에서 fallback("—") 표시', () => {
    render(<VocReviewMetaPanel voc={baseVoc} assigneeMap={assigneeMap} />);
    expect(screen.getByTestId('meta-type')).toHaveTextContent('—');
  });
});
