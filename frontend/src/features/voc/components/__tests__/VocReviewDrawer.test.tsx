import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
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
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status },
  });
}

const ASSIGNEE_MAP: Record<string, string> = {};

type RenderOpts = {
  deleted?: boolean;
  errorStatus?: number;
  reviewStatus?: string | null;
  removeReviewStatus?: boolean;
  onPatch?: ReturnType<typeof vi.fn<[], Promise<unknown>>>;
};

function renderDrawer(role: Role, vocId: string, opts: RenderOpts = {}) {
  const fixture = VOC_FIXTURES.find((r) => r.id === vocId)!;
  let detail: typeof fixture = opts.deleted
    ? { ...fixture, deleted_at: new Date().toISOString() }
    : fixture;
  if (opts.removeReviewStatus) {
    const d = { ...detail } as Partial<typeof fixture>;
    delete d.review_status;
    detail = d as typeof fixture;
  } else if (opts.reviewStatus !== undefined) {
    detail = { ...detail, review_status: opts.reviewStatus as typeof detail.review_status };
  }
  if (opts.errorStatus !== undefined) {
    vi.mocked(vocApi.get).mockRejectedValue(makeAxiosError(opts.errorStatus));
  } else {
    vi.mocked(vocApi.get).mockResolvedValue(detail);
  }
  vi.mocked(vocApi.history).mockResolvedValue([...VOC_HISTORY_FIXTURES]);
  const onPatch = opts.onPatch ?? vi.fn().mockResolvedValue(undefined);
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const utils = render(
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
            onPatch={onPatch}
            onAddNote={vi.fn().mockResolvedValue(undefined)}
          />
        </QueryClientProvider>
      </RoleContext.Provider>
    </MemoryRouter>,
  );
  return { ...utils, onPatch };
}

describe('VocReviewDrawer — Wave 1.6 C-13 (flat sections)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const target = VOC_FIXTURES.find((r) => r.deleted_at === null)!;

  it('role=manager → tablist 없음 + 4섹션 동시 노출 + 작성 form 노출', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('drawer-comments')).toBeInTheDocument());
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    ['drawer-comments', 'drawer-internal-notes', 'drawer-attachments', 'drawer-history'].forEach(
      (id) => expect(screen.getByTestId(id)).toBeInTheDocument(),
    );
    expect(screen.getByLabelText('new comment')).toBeInTheDocument();
    expect(screen.getByLabelText('new internal note')).toBeInTheDocument();
  });

  it('role=user → 댓글 form 미노출 + 내부메모 섹션 미노출 + 첨부 업로드 미노출', async () => {
    renderDrawer('user', target.id);
    await waitFor(() => expect(screen.getByTestId('drawer-comments')).toBeInTheDocument());
    expect(screen.queryByLabelText('new comment')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drawer-internal-notes')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('첨부 업로드')).not.toBeInTheDocument();
  });

  it('deleted_at !== null + role !== admin → VocPermissionGate(reason="deleted") 렌더', async () => {
    renderDrawer('manager', target.id, { deleted: true });
    await waitFor(() => expect(screen.getByTestId('voc-permission-gate')).toBeInTheDocument());
    expect(screen.getByText(/삭제된 항목/)).toBeInTheDocument();
    expect(screen.queryByTestId('drawer-comments')).not.toBeInTheDocument();
  });

  it('변경이력 섹션에 timeline listitem 즉시 노출 (탭 클릭 불필요)', async () => {
    renderDrawer('manager', target.id);
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

  it('review_status === approved → drawer-status data-disabled 존재', async () => {
    renderDrawer('manager', target.id, { reviewStatus: 'approved' });
    await waitFor(() => expect(screen.getByTestId('drawer-status')).toBeInTheDocument());
    expect(screen.getByTestId('drawer-status')).toHaveAttribute('data-disabled');
  });

  it('review_status === unverified → drawer-status data-disabled 없음', async () => {
    renderDrawer('manager', target.id, { reviewStatus: 'unverified' });
    await waitFor(() => expect(screen.getByTestId('drawer-status')).toBeInTheDocument());
    expect(screen.getByTestId('drawer-status')).not.toHaveAttribute('data-disabled');
  });

  it('review_status === null → drawer-status data-disabled 없음', async () => {
    renderDrawer('manager', target.id, { reviewStatus: null });
    await waitFor(() => expect(screen.getByTestId('drawer-status')).toBeInTheDocument());
    expect(screen.getByTestId('drawer-status')).not.toHaveAttribute('data-disabled');
  });

  it('review_status key 없음(undefined) → drawer-status data-disabled 없음', async () => {
    renderDrawer('manager', target.id, { removeReviewStatus: true });
    await waitFor(() => expect(screen.getByTestId('drawer-status')).toBeInTheDocument());
    expect(screen.getByTestId('drawer-status')).not.toHaveAttribute('data-disabled');
  });

  it('approved → onPatch가 호출되지 않음 (Select disabled로 onValueChange 차단)', async () => {
    const { onPatch } = renderDrawer('manager', target.id, { reviewStatus: 'approved' });
    await waitFor(() => expect(screen.getByTestId('drawer-status')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('drawer-status'));
    expect(onPatch).not.toHaveBeenCalled();
  });

  it('drawer에 VocReviewMetaPanel 마운트', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('voc-meta-panel')).toBeInTheDocument());
  });

  it('헤더에 issue_code가 accent mono 스타일로 표시됨', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('drawer-issue-code')).toBeInTheDocument());
    expect(screen.getByTestId('drawer-issue-code')).toHaveTextContent(target.issue_code);
  });

  it('action buttons — copy-link 버튼 노출', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('drawer-btn-copy-link')).toBeInTheDocument());
  });

  it('delete 버튼은 미구현 — 어떤 role에서도 미노출', async () => {
    renderDrawer('admin', target.id);
    await waitFor(() => expect(screen.getByTestId('voc-meta-panel')).toBeInTheDocument());
    expect(screen.queryByTestId('drawer-btn-delete')).not.toBeInTheDocument();
  });

  it('fullscreen 버튼 클릭 → aria-label이 "이전 크기로"로 변경됨', async () => {
    renderDrawer('manager', target.id);
    const btn = await screen.findByTestId('drawer-btn-fullscreen');
    expect(btn).toHaveAttribute('aria-label', '큰 화면으로 보기');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-label', '이전 크기로');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-label', '큰 화면으로 보기');
  });
});
