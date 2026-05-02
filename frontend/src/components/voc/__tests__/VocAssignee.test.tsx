import { render, screen } from '@testing-library/react';
import { VocAssignee } from '../VocAssignee';

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

  it('renders assigned state with initial and name', () => {
    render(<VocAssignee name="홍길동" />);
    const el = screen.getByTestId(/^assignee-(steel|teal|violet)$/);
    expect(el).toBeInTheDocument();
    expect(el).toHaveTextContent('홍길동');
    expect(el).toHaveAttribute('aria-label', '담당자 홍길동');
    const initialNode = el.querySelector('[aria-hidden="true"]');
    expect(initialNode?.textContent).toBe('홍');
  });

  it('initial uses first character of name', () => {
    render(<VocAssignee name="Alice Park" />);
    const initialNode = screen.getByText('A', { selector: '[aria-hidden="true"]' });
    expect(initialNode).toBeInTheDocument();
  });

  it('color class is deterministic for same name', () => {
    const { unmount } = render(<VocAssignee name="홍길동" />);
    const first = screen.getByTestId(/^assignee-(steel|teal|violet)$/).getAttribute('data-testid');
    unmount();
    render(<VocAssignee name="홍길동" />);
    const second = screen.getByTestId(/^assignee-(steel|teal|violet)$/).getAttribute('data-testid');
    expect(first).toBe(second);
  });

  it('color class differs across all 3 buckets across many names', () => {
    const buckets = new Set<string>();
    const names = [
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
    ];
    names.forEach((name) => {
      const { unmount } = render(<VocAssignee name={name} />);
      const id = screen.getByTestId(/^assignee-(steel|teal|violet)$/).getAttribute('data-testid');
      buckets.add(id ?? '');
      unmount();
    });
    expect(buckets.size).toBe(3);
  });

  it('no hex color in className', () => {
    render(<VocAssignee name="홍길동" />);
    const el = screen.getByTestId(/^assignee-(steel|teal|violet)$/);
    expect(el.className).not.toMatch(/#[0-9a-f]/i);
  });

  it('has data-pcomp marker for visual-diff', () => {
    render(<VocAssignee name="홍길동" />);
    const el = screen.getByTestId(/^assignee-(steel|teal|violet)$/);
    expect(el).toHaveAttribute('data-pcomp', 'VocAssignee');
  });

  it('unassigned has data-pcomp marker', () => {
    render(<VocAssignee name={null} />);
    const el = screen.getByTestId('assignee-unassigned');
    expect(el).toHaveAttribute('data-pcomp', 'VocAssignee');
  });
});
