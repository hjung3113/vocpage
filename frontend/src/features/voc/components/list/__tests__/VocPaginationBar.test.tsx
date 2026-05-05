import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VocPaginationBar } from '../VocPaginationBar';

describe('VocPaginationBar', () => {
  it('renders item count in format "start-end / total"', () => {
    render(<VocPaginationBar page={1} perPage={20} total={100} onPageChange={() => {}} />);
    expect(screen.getByText(/1-20 \/ 100/)).toBeInTheDocument();
  });

  it('renders Pagination navigation', () => {
    render(<VocPaginationBar page={1} perPage={20} total={100} onPageChange={() => {}} />);
    expect(screen.getByRole('navigation', { name: /페이지/ })).toBeInTheDocument();
  });

  it('returns null when total is 0', () => {
    const { container } = render(
      <VocPaginationBar page={1} perPage={20} total={0} onPageChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('calls onPageChange when page changes', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<VocPaginationBar page={1} perPage={20} total={100} onPageChange={onPageChange} />);
    await user.click(screen.getByRole('button', { name: '3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
