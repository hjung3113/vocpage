import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VocStatusFilters } from '../VocStatusFilters';

describe('VocStatusFilters', () => {
  it('renders 6 pills with Korean labels', () => {
    render(<VocStatusFilters value="all" onChange={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(6);
    expect(screen.getByRole('button', { name: /전체/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /접수/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /검토중/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /처리중/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /드랍/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /완료/ })).toBeInTheDocument();
  });

  it('calls onChange("all") when "전체" clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VocStatusFilters value={['접수']} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /전체/ }));
    expect(onChange).toHaveBeenCalledWith('all');
  });

  it('sets aria-pressed="true" on "접수" when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VocStatusFilters value="all" onChange={onChange} />);
    const btn = screen.getByRole('button', { name: /접수/ });
    await user.click(btn);
    expect(onChange).toHaveBeenCalledWith(['접수']);
  });

  it('supports multiple selection — both pills pressed when value includes both', () => {
    render(<VocStatusFilters value={['접수', '검토중']} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /접수/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /검토중/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('unpresses pill on re-click (removes from selection)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<VocStatusFilters value={['접수']} onChange={onChange} />);
    const btn = screen.getByRole('button', { name: /접수/ });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await user.click(btn);
    // After removing '접수' from ['접수'], result should be empty array
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('renders rightSlot ReactNode at the end of the row when provided', () => {
    render(
      <VocStatusFilters
        value="all"
        onChange={() => {}}
        rightSlot={<button type="button">필터 더보기</button>}
      />,
    );
    // 7 buttons total: 6 status pills + 1 rightSlot button
    expect(screen.getAllByRole('button')).toHaveLength(7);
    expect(screen.getByRole('button', { name: /필터 더보기/ })).toBeInTheDocument();
  });

  it('omits rightSlot wrapper when rightSlot is not provided', () => {
    const { container } = render(<VocStatusFilters value="all" onChange={() => {}} />);
    // Only the 6 pill buttons; no extra wrapper
    expect(screen.getAllByRole('button')).toHaveLength(6);
    expect(container.querySelectorAll('.ml-auto')).toHaveLength(0);
  });
});
