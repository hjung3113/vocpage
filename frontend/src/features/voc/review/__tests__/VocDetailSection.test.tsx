import { render, screen } from '@testing-library/react';
import { VocDetailSection } from '../ui/VocDetailSection';
import { VocPeopleSection } from '../ui/VocPeopleSection';
import { VocDateSection } from '../ui/VocDateSection';
import { VOC_FIXTURES, FIXTURE_USERS } from '../../../../../../shared/fixtures/voc.fixtures';

const baseVoc = VOC_FIXTURES.find((v) => !v.parent_id)!;
const assigneeMap: Record<string, string> = {
  [FIXTURE_USERS.manager]: '매니저',
  [FIXTURE_USERS.admin]: '관리자',
  [FIXTURE_USERS.user]: '홍길동',
};
const vocTypeMap = {
  '55555555-5555-4555-8555-555555555555': { slug: 'bug', name: 'Bug' },
};

describe('VocDetailSection', () => {
  it('기본 렌더링 — 정보 패널 및 detail 필드 표시', () => {
    render(<VocDetailSection voc={baseVoc} vocTypeMap={vocTypeMap} />);
    expect(screen.getByTestId('voc-detail-panel')).toBeInTheDocument();
    expect(screen.getByTestId('meta-status')).toBeInTheDocument();
    expect(screen.getByTestId('meta-priority')).toBeInTheDocument();
    expect(screen.getByTestId('meta-type')).toBeInTheDocument();
    expect(screen.getByTestId('meta-system')).toBeInTheDocument();
    expect(screen.getByTestId('meta-menu')).toBeInTheDocument();
    expect(screen.getByTestId('meta-tags')).toBeInTheDocument();
  });

  it('vocTypeMap 미제공 → type row에서 fallback("—") 표시', () => {
    render(<VocDetailSection voc={baseVoc} />);
    expect(screen.getByTestId('meta-type')).toHaveTextContent('—');
  });

  it('tags 제공 → VocTagPill 렌더링', () => {
    render(<VocDetailSection voc={baseVoc} tags={['버그', '긴급']} />);
    expect(screen.getByTestId('meta-tags')).toHaveTextContent('버그');
    expect(screen.getByTestId('meta-tags')).toHaveTextContent('긴급');
  });

  it('tags 미제공 → "—" 표시', () => {
    render(<VocDetailSection voc={baseVoc} />);
    expect(screen.getByTestId('meta-tags')).toHaveTextContent('—');
  });
});

describe('VocPeopleSection', () => {
  it('담당자·작성자 필드 렌더링', () => {
    render(<VocPeopleSection voc={baseVoc} assigneeMap={assigneeMap} />);
    expect(screen.getByTestId('voc-people-panel')).toBeInTheDocument();
    expect(screen.getByTestId('meta-assignee')).toBeInTheDocument();
    expect(screen.getByTestId('meta-author')).toBeInTheDocument();
  });

  it('작성자 — assigneeMap에서 author_id로 이름 표시', () => {
    render(<VocPeopleSection voc={baseVoc} assigneeMap={assigneeMap} />);
    expect(screen.getByTestId('meta-author')).toHaveTextContent('홍길동');
  });
});

describe('VocDateSection', () => {
  it('등록일·마감일 필드 렌더링', () => {
    render(<VocDateSection voc={baseVoc} />);
    expect(screen.getByTestId('voc-date-panel')).toBeInTheDocument();
    expect(screen.getByTestId('meta-created_at')).toHaveTextContent(
      baseVoc.created_at.slice(0, 10),
    );
  });

  it('due_date === null → "—" 표시', () => {
    render(<VocDateSection voc={{ ...baseVoc, due_date: null }} />);
    expect(screen.getByTestId('meta-due_date')).toHaveTextContent('—');
  });
});
