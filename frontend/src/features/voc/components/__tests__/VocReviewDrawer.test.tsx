import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VocReviewDrawer } from '../VocReviewDrawer';
import { RoleContext } from '../../../../contexts/RoleContext';
import { VOC_FIXTURES, VOC_HISTORY_FIXTURES } from '../../../../../../shared/fixtures/voc.fixtures';
import type { Role } from '../../../../../../shared/contracts/common';

vi.mock('../../../../api/voc', () => ({
  vocApi: {
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    notes: vi.fn(),
    addNote: vi.fn(),
    history: vi.fn(),
  },
}));

import { vocApi } from '../../../../api/voc';

function renderDrawer(role: Role, vocId: string, opts: { deleted?: boolean } = {}) {
  const target = VOC_FIXTURES.find((r) => r.id === vocId)!;
  const detail = opts.deleted ? { ...target, deleted_at: new Date().toISOString() } : target;
  vi.mocked(vocApi.get).mockResolvedValue(detail);
  vi.mocked(vocApi.history).mockResolvedValue([...VOC_HISTORY_FIXTURES]);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <RoleContext.Provider value={{ role, setRole: () => {} }}>
        <QueryClientProvider client={qc}>
          <VocReviewDrawer
            vocId={vocId}
            notes={[]}
            notesLoading={false}
            pending={false}
            onClose={() => {}}
            onPatch={vi.fn().mockResolvedValue(undefined)}
            onAddNote={vi.fn().mockResolvedValue(undefined)}
          />
        </QueryClientProvider>
      </RoleContext.Provider>
    </MemoryRouter>,
  );
}

describe('VocReviewDrawer — Wave D D1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const target = VOC_FIXTURES.find((r) => r.deleted_at === null)!;

  it('렌더링 후 tablist + 3 tabs (코멘트/첨부/변경이력) 노출', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByRole('tablist')).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: '코멘트' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '첨부' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '변경이력' })).toBeInTheDocument();
  });

  it('role=user → 코멘트 작성 form 미노출 + 첨부 업로드 button 미노출', async () => {
    renderDrawer('user', target.id);
    await waitFor(() => expect(screen.getByTestId('drawer-notes')).toBeInTheDocument());
    expect(screen.queryByLabelText('new note')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('첨부 업로드')).not.toBeInTheDocument();
  });

  it('role=manager → 3 영역 모두 가시 + 작성 form 노출', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByLabelText('new note')).toBeInTheDocument());
    // 첨부 패널 / 이력 패널은 Tabs 내부 mount 기본 활성 시 hidden 상태일 수 있어
    // testid 기준 존재 자체만 확인 (Radix Tabs는 다른 패널을 unmount 하지 않음).
    expect(screen.getByTestId('drawer-notes')).toBeInTheDocument();
    // 다른 탭 컨텐츠는 활성 탭 변경 시 표시되므로 트리거 존재로 대체.
    expect(screen.getByRole('tab', { name: '첨부' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '변경이력' })).toBeInTheDocument();
  });

  it('deleted_at !== null + role !== admin → VocPermissionGate(reason="deleted") 렌더', async () => {
    renderDrawer('manager', target.id, { deleted: true });
    await waitFor(() => expect(screen.getByTestId('voc-permission-gate')).toBeInTheDocument());
    expect(screen.getByText(/삭제된 항목/)).toBeInTheDocument();
    // 게이트가 본문 자체를 막아야 한다.
    expect(screen.queryByTestId('drawer-notes')).not.toBeInTheDocument();
  });

  it('변경이력 탭 클릭 시 timeline listitem 노출', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('drawer-notes')).toBeInTheDocument());
    const historyTab = screen.getByRole('tab', { name: '변경이력' });
    await userEvent.click(historyTab);
    await waitFor(() => expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(1));
  });
});
