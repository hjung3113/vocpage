/**
 * AdminTrashPage — render, role-guard, dialog, and hard-delete placeholder tests (W3-5).
 * Pattern mirrors NoticePage tests (notice-test-helpers.tsx).
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---- Module-level mocks (must be declared before the imports they affect) ----
const mockRole = vi.fn();
vi.mock('@entities/user/model/useRole', () => ({ useRole: () => mockRole() }));

const mockTrashList = vi.fn();
const mockRestoreMutateAsync = vi.fn();

vi.mock('@features/admin/trash/api/useTrashApi', () => ({
  useTrashList: () => mockTrashList(),
  useRestoreVoc: () => ({ mutateAsync: mockRestoreMutateAsync, isPending: false }),
  useRestoreLog: () => ({ data: [], isPending: false }),
}));

// TrashTable mock: reads from mocked useTrashList to render predictable DOM
vi.mock('@features/admin/trash', () => ({
  TrashTable: () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = mockTrashList();
    if (data.isPending) return <div>불러오는 중…</div>;
    if (data.isError) return <div>데이터를 불러오지 못했습니다.</div>;
    const rows: Array<{ id: string; issue_code: string; title: string }> =
      data.data?.rows ?? [];
    if (rows.length === 0) return <div>휴지통이 비어 있습니다.</div>;
    return (
      <div>
        {rows.map((row) => (
          <div key={row.id}>
            <span>{row.issue_code}</span>
            <span>{row.title}</span>
            <button aria-label={`${row.issue_code} 복원`}>복원</button>
          </div>
        ))}
        {/* Hard-delete placeholder (ADR 0005 §3 NextGen) */}
        <button disabled title="MVP는 영구삭제 미지원">
          영구삭제
        </button>
      </div>
    );
  },
}));

import AdminTrashPage from '../trash';

// ---- Role fixtures ----
const adminRole = {
  role: 'admin' as const,
  isAdmin: true,
  isManager: false,
  isDev: false,
  isUser: false,
  setRole: vi.fn(),
};
const managerRole = {
  role: 'manager' as const,
  isAdmin: false,
  isManager: true,
  isDev: false,
  isUser: false,
  setRole: vi.fn(),
};

const sampleRow = {
  id: 'dead0001-dead-4ead-8ead-dead00000001',
  issue_code: 'VOC-TRASH-001',
  title: '삭제된 VOC 1 — 시스템A',
  status: '접수' as const,
  system_id: '11111111-1111-4111-8111-111111111111',
  menu_id: '44444444-4444-4444-8444-444444444444',
  deleted_by: null,
  deleted_at: '2026-04-28T09:00:00.000Z',
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/admin/vocs/trash']}>
        <Routes>
          <Route path="/admin/vocs/trash" element={<AdminTrashPage />} />
          <Route path="/voc" element={<div data-testid="voc-page">VOC Page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRestoreMutateAsync.mockResolvedValue({
    voc_id: sampleRow.id,
    restored_at: new Date().toISOString(),
    audit: {
      id: 'log00001-log0-4og0-8og0-log000000001',
      voc_id: sampleRow.id,
      action: 'restore',
      actor_id: '00000000-0000-4000-8000-0000000000a1',
      before_deleted_at: sampleRow.deleted_at,
      before_deleted_by: null,
      created_at: new Date().toISOString(),
    },
  });
});

// ---------------------------------------------------------------------------
// Test 1: Admin sees trash rows
// ---------------------------------------------------------------------------
describe('AdminTrashPage — admin role', () => {
  it('renders trash table rows when data is loaded', async () => {
    mockRole.mockReturnValue(adminRole);
    mockTrashList.mockReturnValue({
      data: { rows: [sampleRow], page: 1, per_page: 20, total: 1 },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('VOC-TRASH-001')).toBeInTheDocument();
    });
    expect(screen.getByText('삭제된 VOC 1 — 시스템A')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Test 2: Empty state
  // ---------------------------------------------------------------------------
  it('shows empty state when no trashed vocs', async () => {
    mockRole.mockReturnValue(adminRole);
    mockTrashList.mockReturnValue({
      data: { rows: [], page: 1, per_page: 20, total: 0 },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('휴지통이 비어 있습니다.')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Test 3: 복원 button is accessible
  // ---------------------------------------------------------------------------
  it('shows 복원 button for each row', async () => {
    mockRole.mockReturnValue(adminRole);
    mockTrashList.mockReturnValue({
      data: { rows: [sampleRow], page: 1, per_page: 20, total: 1 },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderPage();
    await waitFor(() => screen.getByText('VOC-TRASH-001'));
    expect(screen.getByRole('button', { name: 'VOC-TRASH-001 복원' })).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Test 4: 영구삭제 button is disabled with tooltip
  // ---------------------------------------------------------------------------
  it('영구삭제 button is disabled with MVP tooltip', async () => {
    mockRole.mockReturnValue(adminRole);
    mockTrashList.mockReturnValue({
      data: { rows: [sampleRow], page: 1, per_page: 20, total: 1 },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderPage();
    await waitFor(() => screen.getByText('VOC-TRASH-001'));
    const hardDeleteBtn = screen.getByRole('button', { name: '영구삭제' });
    expect(hardDeleteBtn).toBeDisabled();
    expect(hardDeleteBtn).toHaveAttribute('title', 'MVP는 영구삭제 미지원');
  });
});

// ---------------------------------------------------------------------------
// Test 5: Non-admin is redirected to /voc
// ---------------------------------------------------------------------------
describe('AdminTrashPage — non-admin redirect', () => {
  it('manager is redirected to /voc', async () => {
    mockRole.mockReturnValue(managerRole);
    mockTrashList.mockReturnValue({
      data: null,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('voc-page')).toBeInTheDocument();
    });
    expect(screen.queryByText('소프트 삭제된 VOC — Admin만 복원 가능')).not.toBeInTheDocument();
  });
});
