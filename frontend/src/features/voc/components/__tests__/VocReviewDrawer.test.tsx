import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'; // within: 변경이력 섹션 listitem scoping
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

function makeAxiosError(status: number) {
  const err = new Error(`Request failed with status code ${status}`) as Error & {
    response: { status: number };
  };
  (err as { response: { status: number } }).response = { status };
  return err;
}

const ASSIGNEE_MAP: Record<string, string> = {};

function renderDrawer(
  role: Role,
  vocId: string,
  opts: { deleted?: boolean; errorStatus?: number; reviewStatus?: string } = {},
) {
  const target = VOC_FIXTURES.find((r) => r.id === vocId)!;
  let detail = opts.deleted ? { ...target, deleted_at: new Date().toISOString() } : target;
  if (opts.reviewStatus !== undefined) {
    detail = { ...detail, review_status: opts.reviewStatus as typeof detail.review_status };
  }
  if (opts.errorStatus !== undefined) {
    vi.mocked(vocApi.get).mockRejectedValue(makeAxiosError(opts.errorStatus));
  } else {
    vi.mocked(vocApi.get).mockResolvedValue(detail);
  }
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
            assigneeMap={ASSIGNEE_MAP}
            onClose={() => {}}
            onPatch={vi.fn().mockResolvedValue(undefined)}
            onAddNote={vi.fn().mockResolvedValue(undefined)}
          />
        </QueryClientProvider>
      </RoleContext.Provider>
    </MemoryRouter>,
  );
}

describe('VocReviewDrawer — Wave 1.6 C-13 (flat sections)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const target = VOC_FIXTURES.find((r) => r.deleted_at === null)!;

  it('탭 UI 없이 4개 섹션(댓글/내부메모/첨부/변경이력) 동시 노출 (manager)', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('drawer-comments')).toBeInTheDocument());
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(screen.getByTestId('drawer-comments')).toBeInTheDocument();
    expect(screen.getByTestId('drawer-internal-notes')).toBeInTheDocument();
    expect(screen.getByTestId('drawer-attachments')).toBeInTheDocument();
    expect(screen.getByTestId('drawer-history')).toBeInTheDocument();
  });

  it('role=user → 댓글 작성 form 미노출 + 내부메모 섹션 미노출 + 첨부 업로드 button 미노출', async () => {
    renderDrawer('user', target.id);
    await waitFor(() => expect(screen.getByTestId('drawer-comments')).toBeInTheDocument());
    expect(screen.queryByLabelText('new comment')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drawer-internal-notes')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('첨부 업로드')).not.toBeInTheDocument();
  });

  it('role=manager → 4 섹션 모두 가시 + 작성 form 노출', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByLabelText('new comment')).toBeInTheDocument());
    expect(screen.getByLabelText('new internal note')).toBeInTheDocument();
    expect(screen.getByTestId('drawer-comments')).toBeInTheDocument();
    expect(screen.getByTestId('drawer-internal-notes')).toBeInTheDocument();
    expect(screen.getByTestId('drawer-attachments')).toBeInTheDocument();
    expect(screen.getByTestId('drawer-history')).toBeInTheDocument();
  });

  it('deleted_at !== null + role !== admin → VocPermissionGate(reason="deleted") 렌더', async () => {
    renderDrawer('manager', target.id, { deleted: true });
    await waitFor(() => expect(screen.getByTestId('voc-permission-gate')).toBeInTheDocument());
    expect(screen.getByText(/삭제된 항목/)).toBeInTheDocument();
    expect(screen.queryByTestId('drawer-comments')).not.toBeInTheDocument();
  });

  it('변경이력 섹션에 timeline listitem 즉시 노출 (탭 클릭 불필요)', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('drawer-history')).toBeInTheDocument());
    await waitFor(() => {
      const history = screen.getByTestId('drawer-history');
      expect(within(history).getAllByRole('listitem').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('403 에러 시 VocPermissionGate 표시', async () => {
    renderDrawer('manager', target.id, { errorStatus: 403 });
    await waitFor(() => expect(screen.getByTestId('voc-permission-gate')).toBeInTheDocument());
    expect(screen.queryByText('오류가 발생했습니다.')).not.toBeInTheDocument();
  });

  it('500 에러 시 ErrorState 표시, PermissionGate 미표시', async () => {
    renderDrawer('manager', target.id, { errorStatus: 500 });
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.queryByTestId('voc-permission-gate')).not.toBeInTheDocument();
  });

  it('review_status === approved → drawer-status SelectTrigger에 data-disabled 속성 존재', async () => {
    renderDrawer('manager', target.id, { reviewStatus: 'approved' });
    await waitFor(() => expect(screen.getByTestId('drawer-status')).toBeInTheDocument());
    const trigger = screen.getByTestId('drawer-status');
    expect(trigger).toHaveAttribute('data-disabled');
  });

  it('review_status === unverified → drawer-status SelectTrigger에 data-disabled 속성 없음', async () => {
    renderDrawer('manager', target.id, { reviewStatus: 'unverified' });
    await waitFor(() => expect(screen.getByTestId('drawer-status')).toBeInTheDocument());
    const trigger = screen.getByTestId('drawer-status');
    expect(trigger).not.toHaveAttribute('data-disabled');
  });

  it('review_status === null → drawer-status SelectTrigger에 data-disabled 속성 없음', async () => {
    renderDrawer('manager', target.id, { reviewStatus: null as unknown as string });
    await waitFor(() => expect(screen.getByTestId('drawer-status')).toBeInTheDocument());
    const trigger = screen.getByTestId('drawer-status');
    expect(trigger).not.toHaveAttribute('data-disabled');
  });

  it('review_status key 없음(undefined) → drawer-status SelectTrigger에 data-disabled 속성 없음', async () => {
    const targetFixture = VOC_FIXTURES.find((r) => r.id === target.id)!;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { review_status: _, ...withoutReviewStatus } = targetFixture;
    vi.mocked(vocApi.get).mockResolvedValue(withoutReviewStatus as typeof targetFixture);
    vi.mocked(vocApi.history).mockResolvedValue([...VOC_HISTORY_FIXTURES]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { getByTestId } = render(
      <MemoryRouter>
        <RoleContext.Provider value={{ role: 'manager', setRole: () => {} }}>
          <QueryClientProvider client={qc}>
            <VocReviewDrawer
              vocId={target.id}
              notes={[]}
              notesLoading={false}
              pending={false}
              assigneeMap={ASSIGNEE_MAP}
              onClose={() => {}}
              onPatch={vi.fn().mockResolvedValue(undefined)}
              onAddNote={vi.fn().mockResolvedValue(undefined)}
            />
          </QueryClientProvider>
        </RoleContext.Provider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(getByTestId('drawer-status')).toBeInTheDocument());
    expect(getByTestId('drawer-status')).not.toHaveAttribute('data-disabled');
  });

  it('approved → onPatch가 호출되지 않음 (Select disabled로 onValueChange 차단)', async () => {
    const onPatchMock = vi.fn().mockResolvedValue(undefined);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const targetFixture = VOC_FIXTURES.find((r) => r.id === target.id)!;
    vi.mocked(vocApi.get).mockResolvedValue({
      ...targetFixture,
      review_status: 'approved' as typeof targetFixture.review_status,
    });
    vi.mocked(vocApi.history).mockResolvedValue([...VOC_HISTORY_FIXTURES]);
    render(
      <MemoryRouter>
        <RoleContext.Provider value={{ role: 'manager', setRole: () => {} }}>
          <QueryClientProvider client={qc}>
            <VocReviewDrawer
              vocId={target.id}
              notes={[]}
              notesLoading={false}
              pending={false}
              assigneeMap={ASSIGNEE_MAP}
              onClose={() => {}}
              onPatch={onPatchMock}
              onAddNote={vi.fn().mockResolvedValue(undefined)}
            />
          </QueryClientProvider>
        </RoleContext.Provider>
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByTestId('drawer-status')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('drawer-status'));
    expect(onPatchMock).not.toHaveBeenCalled();
  });

  it('drawer에 VocReviewMetaPanel 마운트 — data-testid="voc-meta-panel" 존재', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('voc-meta-panel')).toBeInTheDocument());
  });
});
