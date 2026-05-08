import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@shared/ui/tooltip';
import { VocReviewDrawer } from '../ui/VocReviewDrawer';
import { RoleContext } from '@entities/user';
import { VOC_FIXTURES, VOC_HISTORY_FIXTURES } from '../../../../../../shared/fixtures/voc.fixtures';
import type { Role } from '@contracts/common';

vi.mock('@entities/voc/api/vocApi', () => ({
  vocApi: {
    list: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    notes: vi.fn(),
    addNote: vi.fn(),
    history: vi.fn(),
  },
}));

import { vocApi } from '@entities/voc/api/vocApi';

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
    <TooltipProvider>
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
              onAddNote={vi.fn().mockResolvedValue(undefined)}
            />
          </QueryClientProvider>
        </RoleContext.Provider>
      </MemoryRouter>
    </TooltipProvider>,
  );
  return { ...utils, onPatch };
}

describe('ReviewDrawer — Wave 1.6 C-13 (flat sections)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const target = VOC_FIXTURES.find((r) => r.deleted_at === null)!;

  it('role=manager → 탭 4개 노출 + 기본(댓글) 탭 활성 + comment form 노출', async () => {
    const user = userEvent.setup();
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('drawer-comments')).toBeInTheDocument());
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    expect(screen.getByTestId('drawer-comments')).toBeInTheDocument();
    expect(screen.getByLabelText('new comment')).toBeInTheDocument();
    // 내부노트는 탭 전환 후 노출
    await user.click(screen.getByRole('tab', { name: '내부메모' }));
    await waitFor(() => expect(screen.getByLabelText('new internal note')).toBeInTheDocument());
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

  it('변경이력 탭 클릭 → timeline listitem 노출', async () => {
    const user = userEvent.setup();
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByRole('tablist')).toBeInTheDocument());
    await user.click(screen.getByRole('tab', { name: '이력' }));
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

  it('drawer에 VocDetailSection 마운트', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('voc-detail-panel')).toBeInTheDocument());
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

  it('copy-link 클릭 → ?id=ISSUE-CODE 포맷으로 clipboard 기록', async () => {
    const written: string[] = [];
    const spy = vi.spyOn(navigator.clipboard, 'writeText').mockImplementation((t) => {
      written.push(t);
      return Promise.resolve();
    });
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('voc-detail-panel')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('drawer-btn-copy-link'));
    await waitFor(() => expect(written.length).toBeGreaterThan(0));
    expect(written[0]).toMatch(/\?id=/);
    expect(written[0]).toContain(target.issue_code);
    spy.mockRestore();
  });

  it('delete 버튼은 미구현 — 어떤 role에서도 미노출', async () => {
    renderDrawer('admin', target.id);
    await waitFor(() => expect(screen.getByTestId('voc-detail-panel')).toBeInTheDocument());
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

  it('role=manager → 분류 섹션에 chip(button) 형태의 편집 가능 필드 노출', async () => {
    renderDrawer('manager', target.id);
    await waitFor(() => expect(screen.getByTestId('voc-detail-panel')).toBeInTheDocument());
    // EditableSelect trigger buttons: 상태, 우선순위 등 여러 button이 렌더돼야 함
    const detailPanel = screen.getByTestId('voc-detail-panel');
    const editBtns = within(detailPanel).getAllByRole('button');
    expect(editBtns.length).toBeGreaterThan(0);
    // 각 버튼에 border 어포던스 클래스 있어야 함
    expect(editBtns[0]!.className).toMatch(/border/);
  });

  it('role=user → 분류 섹션에 편집 button 미노출 (read-only span만 렌더)', async () => {
    renderDrawer('user', target.id);
    await waitFor(() => expect(screen.getByTestId('voc-detail-panel')).toBeInTheDocument());
    const detailPanel = screen.getByTestId('voc-detail-panel');
    // role=user면 EditableSelect 트리거 버튼 없어야 함
    expect(within(detailPanel).queryAllByRole('button')).toHaveLength(0);
  });
});
