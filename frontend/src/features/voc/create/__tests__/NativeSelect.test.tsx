import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NativeSelect } from '../ui/NativeSelect';

const OPTIONS = [
  { id: 'a', label: 'Option A' },
  { id: 'b', label: 'Option B' },
];

describe('NativeSelect', () => {
  it('renders all options when open', async () => {
    const user = userEvent.setup();
    render(<NativeSelect id="sel" value="a" onChange={() => {}} options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    // Options are rendered in the listbox (dropdown portal)
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByText('Option A')).toBeInTheDocument();
    expect(within(listbox).getByText('Option B')).toBeInTheDocument();
  });

  it('renders a combobox trigger', () => {
    const onChange = vi.fn();
    render(<NativeSelect id="sel" value="a" onChange={onChange} options={OPTIONS} />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });
});
