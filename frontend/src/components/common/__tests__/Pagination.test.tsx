import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders nav with aria-label "페이지"', () => {
    render(<Pagination page={1} totalPages={5} onChange={() => {}} />);
    expect(screen.getByRole('navigation', { name: /페이지/ })).toBeInTheDocument();
  });

  it('disables 이전 on first page', () => {
    render(<Pagination page={1} totalPages={10} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /이전/ })).toHaveAttribute('aria-disabled', 'true');
  });

  it('calls onChange when page button clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: '3' }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('disables 다음 on last page', () => {
    render(<Pagination page={10} totalPages={10} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /다음/ })).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders ellipsis when totalPages > 7', () => {
    render(<Pagination page={5} totalPages={20} onChange={() => {}} />);
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
  });
});
