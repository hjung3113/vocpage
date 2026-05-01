import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MockLoginPage from '../MockLoginPage';
import { AuthContext, type AuthContextValue } from '../../contexts/AuthContext';
import * as authApi from '../../api/auth';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogin = vi.fn();
const stubAuth: AuthContextValue = {
  user: null,
  isLoading: false,
  login: mockLogin,
  logout: vi.fn(),
  refresh: vi.fn(),
};

function renderPage() {
  return render(
    <AuthContext.Provider value={stubAuth}>
      <MemoryRouter>
        <MockLoginPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  mockNavigate.mockReset();
  mockLogin.mockReset();
  mockLogin.mockResolvedValue(undefined);
  vi.spyOn(authApi, 'mockLogin').mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@company.com',
    name: 'Mock Admin',
    role: 'admin',
  });
});

test('renders role dropdown with four options (Admin/Manager/Dev/User)', () => {
  renderPage();
  expect(screen.getByRole('combobox')).toBeInTheDocument();
  expect(screen.getAllByRole('option')).toHaveLength(4);
  expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Manager' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Dev' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'User' })).toBeInTheDocument();
});

test('calls mockLogin with role=dev when Dev is selected', async () => {
  const user = userEvent.setup();
  renderPage();

  await user.selectOptions(screen.getByRole('combobox'), 'dev');
  await user.click(screen.getByRole('button', { name: '로그인' }));

  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith('dev');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

test('calls mockLogin with selected role and navigates to / on success', async () => {
  const user = userEvent.setup();
  renderPage();

  await user.selectOptions(screen.getByRole('combobox'), 'manager');
  await user.click(screen.getByRole('button', { name: '로그인' }));

  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith('manager');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

test('shows error message when login fails', async () => {
  mockLogin.mockRejectedValueOnce(new Error('mock-login failed: 400'));
  const user = userEvent.setup();
  renderPage();

  await user.click(screen.getByRole('button', { name: '로그인' }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('로그인 실패');
  });
});
