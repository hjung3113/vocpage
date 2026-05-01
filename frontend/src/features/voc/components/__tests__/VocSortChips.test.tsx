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
});
