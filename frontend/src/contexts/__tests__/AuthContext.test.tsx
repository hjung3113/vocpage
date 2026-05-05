import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AuthProvider, AuthContext, AuthContextValue } from '../AuthContext';
import * as userApi from '../../entities/user/api/userApi';
import * as authApi from '../../features/auth/api/authApi';
import { useContext } from 'react';

function TestConsumer() {
  const ctx = useContext(AuthContext);
  if (!ctx) return <div>no context</div>;
  return (
    <div>
      <div data-testid="user">{ctx.user ? ctx.user.name : 'null'}</div>
      <div data-testid="loading">{String(ctx.isLoading)}</div>
      <button onClick={() => ctx.login('admin')}>login</button>
      <button onClick={() => ctx.logout()}>logout</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

test('미인증 초기 상태: getMe 실패 시 user=null, isLoading=false', async () => {
  vi.spyOn(userApi, 'getMe').mockResolvedValue(null);
  renderWithProvider();

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });
  expect(screen.getByTestId('user').textContent).toBe('null');
});

test('세션 복구: getMe 성공 시 user 설정', async () => {
  vi.spyOn(userApi, 'getMe').mockResolvedValue({
    id: '1',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'admin',
  });
  renderWithProvider();

  await waitFor(() => {
    expect(screen.getByTestId('user').textContent).toBe('Admin');
  });
});

test('logout 후 user=null', async () => {
  vi.spyOn(userApi, 'getMe').mockResolvedValue({
    id: '1',
    email: 'admin@test.com',
    name: 'Admin',
    role: 'admin',
  });
  vi.spyOn(authApi, 'logout').mockResolvedValue();

  const user = userEvent.setup();
  renderWithProvider();

  await waitFor(() => {
    expect(screen.getByTestId('user').textContent).toBe('Admin');
  });

  await user.click(screen.getByRole('button', { name: 'logout' }));

  await waitFor(() => {
    expect(screen.getByTestId('user').textContent).toBe('null');
  });
});

test('getMe가 네트워크 에러 throw 시 user=null, isLoading=false', async () => {
  vi.spyOn(userApi, 'getMe').mockRejectedValue(new Error('network error'));
  renderWithProvider();

  await waitFor(() => {
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });
  expect(screen.getByTestId('user').textContent).toBe('null');
});

test('mock 모드 아닐 때 login 호출 시 에러', async () => {
  vi.spyOn(userApi, 'getMe').mockResolvedValue(null);

  let capturedCtx: AuthContextValue | null = null;

  function CtxCapture() {
    capturedCtx = useContext(AuthContext);
    return null;
  }

  render(
    <AuthProvider>
      <CtxCapture />
    </AuthProvider>,
  );

  await waitFor(() => {
    expect(capturedCtx).not.toBeNull();
  });

  await expect(capturedCtx!.login('admin')).rejects.toThrow(
    'login() is only available in mock auth mode',
  );
});
