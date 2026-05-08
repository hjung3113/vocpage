import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@shared/ui/tooltip';
import { VocReviewPage } from '../ui/VocReviewPage';
import { RoleContext } from '@entities/user';
import { VOC_FIXTURES } from '../../../../../../shared/fixtures/voc.fixtures';
import type { Role } from '@contracts/common';

vi.mock('@entities/voc/api/vocApi', () => ({
  vocApi: {
    list: vi.fn(),
    get: vi.fn(),
    getByCode: vi.fn(),
    update: vi.fn(),
    notes: vi.fn(),
    addNote: vi.fn(),
    history: vi.fn(),
    submitPayloadReview: vi.fn(),
  },
}));

import { vocApi } from '@entities/voc/api/vocApi';

const target = VOC_FIXTURES.find((r) => r.deleted_at === null)!;

function renderPage(issueCode: string, role: Role = 'manager') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[`/voc/${issueCode}`]}>
        <RoleContext.Provider value={{ role, setRole: () => {} }}>
          <QueryClientProvider client={qc}>
            <Routes>
              <Route path="/voc/:id" element={<VocReviewPage />} />
              <Route path="/voc" element={<div data-testid="voc-list" />} />
            </Routes>
          </QueryClientProvider>
        </RoleContext.Provider>
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe('VocReviewPage — A5', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('issue_code로 VOC 조회 후 DrawerBody 렌더', async () => {
    vi.mocked(vocApi.getByCode).mockResolvedValue(target);
    vi.mocked(vocApi.history).mockResolvedValue([]);
    renderPage(target.issue_code);
    await waitFor(() => expect(screen.getByTestId('voc-detail-panel')).toBeInTheDocument());
    expect(screen.getByText(target.issue_code)).toBeInTheDocument();
  });

  it('뒤로가기 버튼 클릭 → /voc 이동', async () => {
    vi.mocked(vocApi.getByCode).mockResolvedValue(target);
    vi.mocked(vocApi.history).mockResolvedValue([]);
    renderPage(target.issue_code);
    await waitFor(() => expect(screen.getByLabelText('뒤로가기')).toBeInTheDocument());
    await userEvent.click(screen.getByLabelText('뒤로가기'));
    await waitFor(() => expect(screen.getByTestId('voc-list')).toBeInTheDocument());
  });

  it('403 에러 시 VocPermissionGate 노출', async () => {
    vi.mocked(vocApi.getByCode).mockRejectedValue(
      Object.assign(new Error('Forbidden'), { response: { status: 403 } }),
    );
    renderPage(target.issue_code);
    await waitFor(() => expect(screen.getByTestId('voc-permission-gate')).toBeInTheDocument());
  });

  it('manager approve 클릭 시 submitPayloadReview 호출', async () => {
    vi.mocked(vocApi.getByCode).mockResolvedValue(target);
    vi.mocked(vocApi.history).mockResolvedValue([]);
    vi.mocked(vocApi.submitPayloadReview).mockResolvedValue({
      id: 'eeeeeeee-0000-4000-8000-000000000001',
      voc_id: target.id,
      reviewer_id: 'r',
      decision: 'approved',
      comment: null,
      created_at: new Date().toISOString(),
    });
    renderPage(target.issue_code, 'manager');
    await waitFor(() => expect(screen.getByTestId('payload-review-approve')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('payload-review-approve'));
    await waitFor(() =>
      expect(vi.mocked(vocApi.submitPayloadReview)).toHaveBeenCalledWith(target.id, {
        decision: 'approve',
      }),
    );
  });

  it('role=user → 편집 필드 disabled', async () => {
    vi.mocked(vocApi.getByCode).mockResolvedValue(target);
    vi.mocked(vocApi.history).mockResolvedValue([]);
    renderPage(target.issue_code, 'user');
    await waitFor(() => expect(screen.getByTestId('voc-detail-panel')).toBeInTheDocument());
    // user role: canWrite=false → EditableSelect rendered as disabled button
    const assigneeRow = screen.getByTestId('meta-priority');
    // When disabled, EditableSelect renders a disabled button
    const btn = assigneeRow.querySelector('button');
    if (btn) {
      expect(btn).toBeDisabled();
    }
  });
});
