import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VocSortChips } from '../VocSortChips';

describe('VocSortChips', () => {
  it('renders radiogroup with aria-label "정렬"', () => {
    render(<VocSortChips sortBy="created_at" sortDir="desc" onChange={() => {}} />);
    expect(screen.getByRole('radiogroup', { name: /정렬/ })).toBeInTheDocument();
  });

  it('renders 6 radio chips with Korean labels', () => {
    render(<VocSortChips sortBy="created_at" sortDir="desc" onChange={() => {}} />);
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(6);
    expect(screen.getByRole('radio', { name: /등록일/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /수정일/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /우선순위/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /상태/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /마감일/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /이슈 ID/ })).toBeInTheDocument();
  });

  it('sets aria-checked="true" on sortBy chip', () => {
    render(<VocSortChips sortBy="priority" sortDir="desc" onChange={() => {}} />);
    expect(screen.getByRole('radio', { name: /우선순위/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /등록일/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with column and default desc dir when different chip clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VocSortChips sortBy="created_at" sortDir="desc" onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: /우선순위/ }));
    expect(onChange).toHaveBeenCalledWith('priority', 'desc');
  });

  it('toggles direction when same chip clicked again', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VocSortChips sortBy="priority" sortDir="desc" onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: /우선순위/ }));
    expect(onChange).toHaveBeenCalledWith('priority', 'asc');
  });

  it('renders list-toolbar wrapper with sort-label "정렬" prefix (prototype parity)', () => {
    const { container } = render(
      <VocSortChips sortBy="created_at" sortDir="desc" onChange={() => {}} />,
    );
    const toolbar = container.querySelector('.list-toolbar');
    expect(toolbar).not.toBeNull();
    const label = container.querySelector('.sort-label');
    expect(label?.textContent).toBe('정렬');
    expect(container.querySelector('.sort-chips')).not.toBeNull();
  });

  it('applies .sort-chip on every chip and .sort-chip--active only on active', () => {
    const { container } = render(
      <VocSortChips sortBy="priority" sortDir="desc" onChange={() => {}} />,
    );
    const chips = container.querySelectorAll('.sort-chip');
    expect(chips.length).toBe(6);
    const active = container.querySelectorAll('.sort-chip--active');
    expect(active.length).toBe(1);
    expect(active[0]?.getAttribute('aria-checked')).toBe('true');
  });

  it('renders .sort-chip-icon arrow on active chip only', () => {
    const { container, rerender } = render(
      <VocSortChips sortBy="priority" sortDir="desc" onChange={() => {}} />,
    );
    const iconsDesc = container.querySelectorAll('.sort-chip-icon');
    expect(iconsDesc.length).toBe(1);
    expect(iconsDesc[0]?.textContent).toBe('↓');
    rerender(<VocSortChips sortBy="priority" sortDir="asc" onChange={() => {}} />);
    const iconsAsc = container.querySelectorAll('.sort-chip-icon');
    expect(iconsAsc.length).toBe(1);
    expect(iconsAsc[0]?.textContent).toBe('↑');
  });
});
