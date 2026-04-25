import { render, screen } from '@testing-library/react';
import { useContext } from 'react';
import { MasterCacheContext, MasterCacheProvider } from '../MasterCacheContext';

// Mock the masters API so tests don't make real network calls
vi.mock('../../api/masters', () => ({
  getMasterStatus: vi.fn().mockResolvedValue({ mode: 'live' }),
  searchMaster: vi.fn().mockResolvedValue([]),
  triggerAdminRefresh: vi.fn().mockResolvedValue({ swapped: true }),
  triggerVocRefresh: vi.fn().mockResolvedValue({ swapped: true }),
}));

// Provide a minimal AuthContext so MasterCacheProvider can read user role
import { AuthContext } from '../AuthContext';
import type { AuthContextValue } from '../AuthContext';

function makeAuthValue(role: 'admin' | 'manager' | 'user' | null): AuthContextValue {
  return {
    user: role ? { id: '1', name: 'Test', role } : null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  };
}

function TestConsumer() {
  const ctx = useContext(MasterCacheContext)!;
  return (
    <div>
      <div data-testid="mode">{ctx.mode}</div>
      <div data-testid="isSnapshotMode">{String(ctx.isSnapshotMode)}</div>
      <div data-testid="isColdStartMode">{String(ctx.isColdStartMode)}</div>
    </div>
  );
}

function renderWithProvider(role: 'admin' | 'manager' | 'user' | null = null) {
  return render(
    <AuthContext.Provider value={makeAuthValue(role)}>
      <MasterCacheProvider>
        <TestConsumer />
      </MasterCacheProvider>
    </AuthContext.Provider>,
  );
}

test('초기값 mode=unknown (user role)', () => {
  renderWithProvider('user');
  expect(screen.getByTestId('mode').textContent).toBe('unknown');
  expect(screen.getByTestId('isSnapshotMode').textContent).toBe('false');
  expect(screen.getByTestId('isColdStartMode').textContent).toBe('false');
});

test('초기값 mode=unknown (no user)', () => {
  renderWithProvider(null);
  expect(screen.getByTestId('mode').textContent).toBe('unknown');
});
