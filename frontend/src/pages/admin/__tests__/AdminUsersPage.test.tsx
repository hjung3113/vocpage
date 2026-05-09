/**
 * AdminUsersPage — render, role-guard, invite-button, and display tests (W3-7).
 * Pattern mirrors AdminTrashPage.test.tsx.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---- Module-level mocks ----
const mockRole = vi.fn();
vi.mock('@entities/user/model/useRole', () => ({ useRole: () => mockRole() }));

const mockUserList = vi.fn();
const mockPatchMutateAsync = vi.fn();

vi.mock('@features/admin/users/api/useUsersApi', () => ({
  useUserList: () => mockUserList(),
  usePatchUser: () => ({ mutateAsync: mockPatchMutateAsync, isPending: false }),
}));

vi.mock('@features/admin/users', () => ({
  UsersTable: () => {
    const data = mockUserList();
    if (data.isPending) return <div>불러오는 중…</div>;
    if (data.isError) return <div>데이터를 불러오지 못했습니다.</div>;
    const rows: Array<{ id: string; display_name: string; role: string; is_active: boolean }> =
      data.data?.rows ?? [];
    if (rows.length === 0) return <div>사용자가 없습니다.</div>;
    return (
      <div>
        {rows.map((user) => (
          <div key={user.id}>
            <span>{user.display_name}</span>
            <span>{user.role}</span>
            <span>{user.is_active ? '활성' : '비활성'}</span>
          </div>
        ))}
      </div>
    );
  },
}));

import AdminUsersPage from '../users';

const adminRole = { role: 'admin' as const, isAdmin: true, isManager: false, isDev: false, isUser: false, setRole: vi.fn() };
const managerRole = { role: 'manager' as const, isAdmin: false, isManager: true, isDev: false, isUser: false, setRole: vi.fn() };
const devRole = { role: 'dev' as const, isAdmin: false, isManager: false, isDev: true, isUser: false, setRole: vi.fn() };
const userRole = { role: 'user' as const, isAdmin: false, isManager: false, isDev: false, isUser: true, setRole: vi.fn() };

const sampleUsers = [
  { id: 'a0000001-a000-4000-8000-a00000000001', ad_username: 'admin.main', display_name: '관리자', email: 'admin.main@example.com', role: 'admin', is_active: true, created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'a0000004-a000-4000-8000-a00000000004', ad_username: 'park.user', display_name: '박일반', email: 'park.user@example.com', role: 'user', is_active: true, created_at: '2026-01-15T00:00:00.000Z' },
  { id: 'a0000005-a000-4000-8000-a00000000005', ad_username: 'inactive.user', display_name: '비활성사용자', email: 'inactive.user@example.com', role: 'user', is_active: false, created_at: '2026-01-20T00:00:00.000Z' },
];

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/voc" element={<div data-testid="voc-page">VOC Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockAdminWithData(rows = sampleUsers) {
  mockRole.mockReturnValue(adminRole);
  mockUserList.mockReturnValue({ data: { rows, page: 1, per_page: 20, total: rows.length }, isPending: false, isError: false, refetch: vi.fn() });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPatchMutateAsync.mockResolvedValue(sampleUsers[0]);
});

describe('AdminUsersPage — admin role', () => {
  it('renders user list', async () => {
    mockAdminWithData();
    renderPage();
    await waitFor(() => expect(screen.getByText('관리자')).toBeInTheDocument());
    expect(screen.getByText('박일반')).toBeInTheDocument();
    expect(screen.getByText('비활성사용자')).toBeInTheDocument();
  });

  it('사용자 초대 button is present and disabled (spec §15.2 MVP)', async () => {
    mockAdminWithData();
    renderPage();
    await waitFor(() => screen.getByText('관리자'));
    const inviteBtn = screen.getByRole('button', { name: /사용자 초대/i });
    expect(inviteBtn).toBeInTheDocument();
    expect(inviteBtn).toBeDisabled();
  });

  it('renders page title 사용자', async () => {
    mockAdminWithData();
    renderPage();
    await waitFor(() => screen.getByText('관리자'));
    expect(screen.getByText('사용자')).toBeInTheDocument();
  });

  it('shows empty state when no users', async () => {
    mockAdminWithData([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('사용자가 없습니다.')).toBeInTheDocument());
  });

  it('shows active/inactive status for users', async () => {
    mockAdminWithData();
    renderPage();
    await waitFor(() => screen.getByText('관리자'));
    expect(screen.getAllByText('활성').length).toBeGreaterThan(0);
    expect(screen.getAllByText('비활성').length).toBeGreaterThan(0);
  });
});

describe('AdminUsersPage — non-admin redirect', () => {
  const nonAdminCases = [
    { label: 'manager', roleObj: managerRole },
    { label: 'dev', roleObj: devRole },
    { label: 'user', roleObj: userRole },
  ];

  it.each(nonAdminCases)('$label is redirected to /voc', async ({ roleObj }) => {
    mockRole.mockReturnValue(roleObj);
    mockUserList.mockReturnValue({ data: null, isPending: false, isError: false, refetch: vi.fn() });
    renderPage();
    await waitFor(() => expect(screen.getByTestId('voc-page')).toBeInTheDocument());
  });
});
