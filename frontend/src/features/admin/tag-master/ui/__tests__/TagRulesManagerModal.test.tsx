/**
 * TagRulesManagerModal — modal-based CRUD for tag rules (Phase 01 Plan 06 Task 2).
 *
 * Coverage per 01-UI-SPEC.md anatomy + 01-CONTEXT.md D-13 (permission gating)
 * + threat T-01-15 (destructive actions hidden for non-admin):
 *   1. Header renders {tag.name} · 규칙 N건 + subtitle.
 *   2. Loading: 3 skeleton rows during initial fetch.
 *   3. Empty state copy when rules array empty.
 *   4. Sub-table renders TagRule rows from useAdminTagRules.
 *   5. Submit add-form with one keyword fires useCreateTagRule.mutate.
 *   6. Submit disabled when keywords array empty.
 *   7. Manager (isAdmin=false): 삭제 / 일시중지 menu items NOT in DOM.
 *   8. Admin: 삭제 menu item present; clicking → AlertDialog → confirm → useDeleteTagRule.mutate.
 *   9. Mutation error → inline banner with create-error copy.
 *  10. Author column: created_by_name=null renders em dash "—".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TagMasterItem, TagRuleT } from '@contracts/admin/tag';

// ── Mock useRole ──────────────────────────────────────────────────────────────
const roleMock = vi.fn();
vi.mock('@entities/user/model/useRole', () => ({
  useRole: () => roleMock(),
}));

// ── Mock tag-master api hooks ─────────────────────────────────────────────────
const useAdminTagRulesMock = vi.fn();
const createMutateMock = vi.fn();
const updateMutateMock = vi.fn();
const deleteMutateMock = vi.fn();
const suspendMutateMock = vi.fn();
const useCreateTagRuleMock = vi.fn();
const useUpdateTagRuleMock = vi.fn();
const useDeleteTagRuleMock = vi.fn();
const useSuspendTagRuleMock = vi.fn();

vi.mock('../../api/tag-master.api', () => ({
  useAdminTagRules: (...args: unknown[]) => useAdminTagRulesMock(...args),
  useCreateTagRule: (...args: unknown[]) => useCreateTagRuleMock(...args),
  useUpdateTagRule: (...args: unknown[]) => useUpdateTagRuleMock(...args),
  useDeleteTagRule: (...args: unknown[]) => useDeleteTagRuleMock(...args),
  useSuspendTagRule: () => useSuspendTagRuleMock(),
}));

import { TagRulesManagerModal } from '../TagRulesManagerModal';

const TAG: TagMasterItem = {
  id: '11111111-1111-4111-8111-111111111111',
  name: '버그',
  slug: 'bug',
  kind: 'general',
  is_external: false,
  usage_count: 5,
  rule_ref_count: 2,
  created_at: '2026-01-01T00:00:00.000Z',
};

const RULE_A: TagRuleT = {
  id: '22222222-2222-4222-8222-222222222222',
  tag_id: TAG.id,
  kind: 'general',
  keywords: ['버그', '오류'],
  match_mode: 'keyword',
  suspended_until: null,
  created_by: '00000000-0000-4000-8000-000000000001',
  created_by_name: 'Mock Admin',
  created_at: '2026-02-01T00:00:00.000Z',
};

const RULE_B: TagRuleT = {
  id: '33333333-3333-4333-8333-333333333333',
  tag_id: TAG.id,
  kind: 'general',
  keywords: ['legacy'],
  match_mode: 'keyword',
  suspended_until: null,
  created_by: null,
  created_by_name: null,
  created_at: '2026-02-02T00:00:00.000Z',
};

beforeEach(() => {
  roleMock.mockReturnValue({ role: 'admin', isAdmin: true, isManager: false, isDev: false, isUser: false, setRole: vi.fn() });
  useAdminTagRulesMock.mockReturnValue({
    data: { rows: [RULE_A, RULE_B], page: 1, per_page: 20, total: 2 },
    isLoading: false,
    isError: false,
    error: null,
  });
  useCreateTagRuleMock.mockReturnValue({ mutate: createMutateMock, isPending: false });
  useUpdateTagRuleMock.mockReturnValue({ mutate: updateMutateMock, isPending: false });
  useDeleteTagRuleMock.mockReturnValue({ mutate: deleteMutateMock, isPending: false });
  useSuspendTagRuleMock.mockReturnValue({ mutate: suspendMutateMock, isPending: false });
  createMutateMock.mockReset();
  updateMutateMock.mockReset();
  deleteMutateMock.mockReset();
  suspendMutateMock.mockReset();
});

function renderModal(onClose = vi.fn()) {
  return render(<TagRulesManagerModal tag={TAG} onClose={onClose} />);
}

describe('TagRulesManagerModal', () => {
  it('renders header with tag name + rule count + subtitle', () => {
    renderModal();
    expect(screen.getByText(/버그/)).toBeInTheDocument();
    expect(screen.getByText(/규칙 2건/)).toBeInTheDocument();
    expect(screen.getByText('자동 태깅 규칙 관리')).toBeInTheDocument();
  });

  it('shows 3 skeleton rows while loading', () => {
    useAdminTagRulesMock.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    renderModal();
    expect(screen.getAllByTestId('rule-skeleton-row')).toHaveLength(3);
  });

  it('renders empty state copy when rules array empty', () => {
    useAdminTagRulesMock.mockReturnValue({
      data: { rows: [], page: 1, per_page: 20, total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    renderModal();
    expect(screen.getByText('등록된 규칙이 없습니다')).toBeInTheDocument();
    expect(screen.getByText('위 폼에서 첫 번째 규칙을 추가하세요')).toBeInTheDocument();
  });

  it('renders sub-table rows from useAdminTagRules data', () => {
    renderModal();
    expect(screen.getByText('버그')).toBeInTheDocument();
    expect(screen.getByText('오류')).toBeInTheDocument();
    expect(screen.getByText('legacy')).toBeInTheDocument();
  });

  it('submit-add fires useCreateTagRule.mutate with keywords + match_mode', async () => {
    const user = userEvent.setup();
    renderModal();
    const input = screen.getByLabelText('새 규칙 키워드') as HTMLInputElement;
    await user.type(input, '신규{Enter}');
    await user.click(screen.getByRole('button', { name: '+ 규칙 추가' }));
    expect(createMutateMock).toHaveBeenCalledTimes(1);
    const [payload] = createMutateMock.mock.calls[0];
    expect(payload).toEqual({ keywords: ['신규'], match_mode: 'keyword' });
  });

  it('submit button disabled when keywords empty', () => {
    renderModal();
    const btn = screen.getByRole('button', { name: '+ 규칙 추가' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('Manager role: 삭제 / 일시중지 menu items not rendered', async () => {
    roleMock.mockReturnValue({ role: 'manager', isAdmin: false, isManager: true, isDev: false, isUser: false, setRole: vi.fn() });
    const user = userEvent.setup();
    renderModal();
    // Open first row's action menu
    const menuTriggers = screen.getAllByTestId('rule-action-menu');
    await user.click(menuTriggers[0]);
    expect(screen.queryByRole('menuitem', { name: '삭제' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: '일시중지' })).not.toBeInTheDocument();
    // 수정 still visible
    expect(screen.getByRole('menuitem', { name: '수정' })).toBeInTheDocument();
  });

  it('Admin role: 삭제 → AlertDialog → confirm → useDeleteTagRule.mutate(ruleId)', async () => {
    const user = userEvent.setup();
    renderModal();
    const menuTriggers = screen.getAllByTestId('rule-action-menu');
    await user.click(menuTriggers[0]);
    await user.click(screen.getByRole('menuitem', { name: '삭제' }));
    // Confirm dialog
    expect(screen.getByText(/삭제된 규칙은 복구할 수 없습니다/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(deleteMutateMock).toHaveBeenCalledWith(RULE_A.id, expect.anything());
  });

  it('mutation error: inline banner with create-error copy', async () => {
    const user = userEvent.setup();
    // Simulate onError callback firing by capturing the second arg of mutate
    createMutateMock.mockImplementation((_payload, opts) => {
      opts?.onError?.(new Error('500'));
    });
    renderModal();
    const input = screen.getByLabelText('새 규칙 키워드') as HTMLInputElement;
    await user.type(input, '신규{Enter}');
    await user.click(screen.getByRole('button', { name: '+ 규칙 추가' }));
    expect(
      screen.getByText('규칙을 추가하지 못했습니다. 잠시 후 다시 시도해 주세요'),
    ).toBeInTheDocument();
  });

  it('author column renders em dash for created_by_name=null', () => {
    renderModal();
    const ruleBRow = screen.getByText('legacy').closest('tr')!;
    expect(within(ruleBRow).getByText('—')).toBeInTheDocument();
  });
});
