import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MockLoginPage from '../MockLoginPage';
import * as authApi from '../../api/auth';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <MockLoginPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockNavigate.mockReset();
  vi.spyOn(authApi, 'mockLogin').mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@company.com',
    name: 'Mock Admin',
    role: 'admin',
  });
});

test('renders role dropdown with three options', () => {
  renderPage();
  expect(screen.getByRole('combobox')).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Manager' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'User' })).toBeInTheDocument();
});

test('calls mockLogin with selected role and navigates to / on success', async () => {
  const user = userEvent.setup();
  renderPage();

  await user.selectOptions(screen.getByRole('combobox'), 'manager');
  vi.spyOn(authApi, 'mockLogin').mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000002',
    email: 'manager@company.com',
    name: 'Mock Manager',
    role: 'manager',
  });

  await user.click(screen.getByRole('button', { name: '로그인' }));

  await waitFor(() => {
    expect(authApi.mockLogin).toHaveBeenCalledWith('manager');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

test('shows error message when login fails', async () => {
  vi.spyOn(authApi, 'mockLogin').mockRejectedValue(new Error('mock-login failed: 400'));
  const user = userEvent.setup();
  renderPage();

  await user.click(screen.getByRole('button', { name: '로그인' }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('로그인 실패');
  });
});
