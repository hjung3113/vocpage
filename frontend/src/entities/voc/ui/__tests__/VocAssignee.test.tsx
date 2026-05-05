import { render, screen } from '@testing-library/react';
import { VocAssignee, hashAssigneeColor } from '../VocAssignee';

describe('VocAssignee', () => {
  it('renders unassigned state when name is null', () => {
    render(<VocAssignee name={null} />);
    const el = screen.getByTestId('assignee-unassigned');
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('미배정');
    expect(el).toHaveAttribute('aria-label', '미배정');
    const icon = el.querySelector('[aria-hidden="true"]');
    expect(icon?.getAttribute('class') ?? '').toContain('user-x');
  });

  it('treats empty string as unassigned', () => {
    render(<VocAssignee name="" />);
    expect(screen.getByTestId('assignee-unassigned')).toBeInTheDocument();
  });

  it('treats whitespace-only string as unassigned', () => {
    render(<VocAssignee name="   " />);
    expect(screen.getByTestId('assignee-unassigned')).toBeInTheDocument();
  });

  it('renders assigned state with initial and name', () => {
    render(<VocAssignee name="홍길동" />);
    const el = screen.getByTestId(/^assignee-(steel|teal|violet)$/);
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('홍길동');
    expect(el).toHaveAttribute('aria-label', '담당자 홍길동');
    const initialNode = el.querySelector('[aria-hidden="true"]');
    expect(initialNode?.textContent).toBe('홍');
  });

  it('initial uses first character of name (latin)', () => {
    render(<VocAssignee name="Alice Park" />);
    const initialNode = screen.getByText('A', { selector: '[aria-hidden="true"]' });
    expect(initialNode).toBeInTheDocument();
  });

  it('explicit colorClass prop overrides hash', () => {
    render(<VocAssignee name="홍길동" colorClass="violet" />);
    expect(screen.getByTestId('assignee-violet')).toBeInTheDocument();
  });

  it('hashAssigneeColor is deterministic and total over the 3 buckets', () => {
    expect(hashAssigneeColor('홍길동')).toBe(hashAssigneeColor('홍길동'));
    const buckets = new Set<string>();
    [
      '홍길동',
      '김철수',
      '이영희',
      '박민수',
      '최지우',
      '정아름',
      'Alice',
      'Bob',
      'Carol',
      'Dave',
    ].forEach((n) => {
      buckets.add(hashAssigneeColor(n));
    });
    expect(buckets.size).toBe(3);
  });

  it('hashAssigneeColor locks specific name→bucket pairs (regression guard)', () => {
    expect(hashAssigneeColor('홍길동')).toBe('violet');
    expect(hashAssigneeColor('이분석')).toBe('steel');
    expect(hashAssigneeColor('Alice')).toBe('teal');
  });

  it('rendered output contains no hex literal anywhere (className OR inline style)', () => {
    render(<VocAssignee name="홍길동" />);
    const el = screen.getByTestId(/^assignee-(steel|teal|violet)$/);
    expect(el.outerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('has data-pcomp marker for visual-diff (assigned)', () => {
    render(<VocAssignee name="홍길동" />);
    const el = screen.getByTestId(/^assignee-(steel|teal|violet)$/);
    expect(el).toHaveAttribute('data-pcomp', 'VocAssignee');
  });

  it('has data-pcomp marker for visual-diff (unassigned)', () => {
    render(<VocAssignee name={null} />);
    const el = screen.getByTestId('assignee-unassigned');
    expect(el).toHaveAttribute('data-pcomp', 'VocAssignee');
  });
});
