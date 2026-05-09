/**
 * AdminMastersPage — role-guard, status display, and refresh action tests (W3-6).
 * Pattern mirrors AdminTrashPage.test.tsx.
 * Spec: requirements.md §16.3, external-masters.md §0
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---- Module-level mocks ----
const mockRole = vi.fn();
vi.mock('@entities/user/model/useRole', () => ({ useRole: () => mockRole() }));

const mockUseMasterStatus = vi.fn();
const mockRefreshMutateAsync = vi.fn();

vi.mock('@features/admin/external-masters/api/useMastersApi', () => ({
  useMasterStatus: () => mockUseMasterStatus(),
  useRefreshMasters: () => ({
    mutateAsync: mockRefreshMutateAsync,
    isPending: false,
  }),
}));

// MastersTable mock — renders predictable DOM based on mocked hook
vi.mock('@features/admin/external-masters', () => ({
  MastersTable: ({ canRefresh }: { canRefresh: boolean }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const status = mockUseMasterStatus();
    if (status.isPending) return <div>불러오는 중…</div>;
    if (status.isError) return <div>마스터 상태를 불러오지 못했습니다.</div>;
    const mode = status.data?.mode ?? 'cold';
    return (
      <div>
        <span data-testid="mode-badge">{mode}</span>
        <span>설비 마스터</span>
        <span>DB 마스터</span>
        <span>프로그램 마스터</span>
        {canRefresh && (
          <button
            onClick={() => void mockRefreshMutateAsync()}
            data-testid="refresh-btn"
          >
            전체 Refresh
          </button>
        )}
      </div>
    );
  },
}));

import AdminMastersPage from '../masters';

// ---- Role fixtures ----
const adminRole  = { role: 'admin'   as const, isAdmin: true,  isManager: false, isDev: false, isUser: false };
const managerRole= { role: 'manager' as const, isAdmin: false, isManager: true,  isDev: false, isUser: false };
const devRole    = { role: 'dev'     as const, isAdmin: false, isManager: false, isDev: true,  isUser: false };
const userRole   = { role: 'user'    as const, isAdmin: false, isManager: false, isDev: false, isUser: true  };

const LIVE_STATUS = {
  isPending: false,
  isError: false,
  data: { loaded_at: '2026-04-26T12:36:07.262Z', cooldown_until: null, mode: 'live' as const, sources: {} },
};

const COLD_STATUS = {
  isPending: false,
  isError: false,
  data: { loaded_at: null, cooldown_until: null, mode: 'cold' as const, sources: {} },
};

const SNAPSHOT_STATUS = {
  isPending: false,
  isError: false,
  data: { loaded_at: '2026-04-26T12:36:07.262Z', cooldown_until: null, mode: 'snapshot' as const, sources: {} },
};

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={['/admin/masters']}>
          <Routes>
            <Route path="/admin/masters" element={children} />
            <Route path="/voc" element={<div>VOC Page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMasterStatus.mockReturnValue(LIVE_STATUS);
});

// ─── Role guard ───────────────────────────────────────────────────────────────

describe('Role guard — FE redirect', () => {
  it('admin → renders page', async () => {
    mockRole.mockReturnValue(adminRole);
    const { Wrapper } = { Wrapper: makeWrapper() };
    render(<AdminMastersPage />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByTestId('mode-badge')).toBeInTheDocument());
  });

  it('manager → renders page', async () => {
    mockRole.mockReturnValue(managerRole);
    render(<AdminMastersPage />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByTestId('mode-badge')).toBeInTheDocument());
  });

  it('dev → renders page (read-only, OQ-2 Option B)', async () => {
    mockRole.mockReturnValue(devRole);
    render(<AdminMastersPage />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByTestId('mode-badge')).toBeInTheDocument());
  });

  it('user → redirected to /voc', async () => {
    mockRole.mockReturnValue(userRole);
    render(<AdminMastersPage />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByText('VOC Page')).toBeInTheDocument());
  });
});

// ─── Mode badges ─────────────────────────────────────────────────────────────

describe('Mode badges', () => {
  it('shows live mode', async () => {
    mockRole.mockReturnValue(adminRole);
    mockUseMasterStatus.mockReturnValue(LIVE_STATUS);
    render(<AdminMastersPage />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByTestId('mode-badge')).toHaveTextContent('live'));
  });

  it('shows cold-start mode', async () => {
    mockRole.mockReturnValue(adminRole);
    mockUseMasterStatus.mockReturnValue(COLD_STATUS);
    render(<AdminMastersPage />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByTestId('mode-badge')).toHaveTextContent('cold'));
  });

  it('shows snapshot mode', async () => {
    mockRole.mockReturnValue(adminRole);
    mockUseMasterStatus.mockReturnValue(SNAPSHOT_STATUS);
    render(<AdminMastersPage />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByTestId('mode-badge')).toHaveTextContent('snapshot'));
  });
});

// ─── Refresh button — canRefresh ─────────────────────────────────────────────

describe('Refresh button permission', () => {
  it('admin sees refresh button', async () => {
    mockRole.mockReturnValue(adminRole);
    render(<AdminMastersPage />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByTestId('refresh-btn')).toBeInTheDocument());
  });

  it('manager sees refresh button', async () => {
    mockRole.mockReturnValue(managerRole);
    render(<AdminMastersPage />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByTestId('refresh-btn')).toBeInTheDocument());
  });

  it('dev does NOT see refresh button (read-only)', async () => {
    mockRole.mockReturnValue(devRole);
    render(<AdminMastersPage />, { wrapper: makeWrapper() });
    await waitFor(() => expect(screen.getByTestId('mode-badge')).toBeInTheDocument());
    expect(screen.queryByTestId('refresh-btn')).not.toBeInTheDocument();
  });

  it('refresh button calls mutateAsync', async () => {
    mockRole.mockReturnValue(adminRole);
    mockRefreshMutateAsync.mockResolvedValueOnce({
      swapped: true,
      loaded_at: '2026-04-26T12:36:07.262Z',
      sources: { equipment: { loaded_at: '2026-04-26T12:36:07.262Z' }, db: { loaded_at: '2026-04-26T12:36:07.262Z' } },
    });
    render(<AdminMastersPage />, { wrapper: makeWrapper() });
    await waitFor(() => screen.getByTestId('refresh-btn'));
    await userEvent.click(screen.getByTestId('refresh-btn'));
    expect(mockRefreshMutateAsync).toHaveBeenCalledTimes(1);
  });
});
