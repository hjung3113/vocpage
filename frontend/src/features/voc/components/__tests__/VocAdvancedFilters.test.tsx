import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VocAdvancedFilters } from '../VocAdvancedFilters';
import type {
  AssigneeListItem,
  TagListItem,
  VocTypeListItem,
} from '../../../../../../shared/contracts/master/io';

const assignees: AssigneeListItem[] = [
  { id: '11111111-1111-1111-1111-111111111111', ad_username: 'kim.admin', display_name: '김관리' },
  { id: '22222222-2222-2222-2222-222222222222', ad_username: 'lee.dev', display_name: '이개발' },
];

const tags: TagListItem[] = [
  { id: '33333333-3333-3333-3333-333333333333', name: '버그', slug: 'bug', kind: 'system' },
];

const vocTypes: VocTypeListItem[] = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: '오류',
    slug: 'error',
    color: null,
    sort_order: 1,
    is_archived: false,
  },
];

function renderClosed(overrides: Partial<React.ComponentProps<typeof VocAdvancedFilters>> = {}) {
  const props: React.ComponentProps<typeof VocAdvancedFilters> = {
    open: false,
    onToggle: vi.fn(),
    assignees,
    tags,
    vocTypes,
    value: {},
    onChange: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  };
  return { props, ...render(<VocAdvancedFilters {...props} />) };
}

describe('VocAdvancedFilters', () => {
  it('shows only "필터 더보기" button when closed', () => {
    renderClosed();
    expect(screen.getByRole('button', { name: /필터 더보기/ })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /담당자/ })).not.toBeInTheDocument();
  });

  it('calls onToggle on toggle click; renders 4 groups when open', async () => {
    const user = userEvent.setup();
    const { props, rerender } = renderClosed();
    await user.click(screen.getByRole('button', { name: /필터 더보기/ }));
    expect(props.onToggle).toHaveBeenCalledTimes(1);

    rerender(<VocAdvancedFilters {...props} open />);
    expect(screen.getByRole('group', { name: /담당자/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /우선순위/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /유형/ })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /태그/ })).toBeInTheDocument();
  });

  it('calls onChange with selected assignee id when chip clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderClosed({ open: true, onChange });
    await user.click(screen.getByRole('button', { name: /김관리/ }));
    expect(onChange).toHaveBeenCalledWith({ assignees: ['11111111-1111-1111-1111-111111111111'] });
  });

  it('marks both selected priorities as aria-pressed=true', () => {
    renderClosed({ open: true, value: { priorities: ['urgent', 'high'] } });
    expect(screen.getByRole('button', { name: /긴급/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^높음$/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onReset when 초기화 clicked', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    renderClosed({ open: true, onReset });
    await user.click(screen.getByRole('button', { name: /초기화/ }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('flips aria-hidden on the panel when open toggles', () => {
    const { rerender } = renderClosed();
    const panel = document.querySelector('[data-pcomp="voc-advanced-filters"]');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
    rerender(
      <VocAdvancedFilters
        open={true}
        onToggle={vi.fn()}
        assignees={assignees}
        tags={tags}
        vocTypes={vocTypes}
        value={{}}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(panel).toHaveAttribute('aria-hidden', 'false');
  });
});
