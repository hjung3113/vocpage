import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VocActionSection } from '../ui/VocActionSection';

// Mock the drawer queries so tests are isolated from network
vi.mock('../model/useDrawerQueries', () => ({
  useVocComments: vi.fn(),
  useVocSubtasks: vi.fn(),
  useVocHistory: vi.fn(),
}));

import { useVocComments, useVocSubtasks, useVocHistory } from '../model/useDrawerQueries';

const baseProps = {
  vocId: 'voc-1',
  parentIsSubtask: false,
  currentUserId: 'user-1',
  role: 'manager' as const,
  isOwner: false,
  canWrite: true,
  canSeeInternal: false,
  pending: false,
  notes: [],
  notesLoading: false,
  onAddNote: vi.fn(),
};

function setupMocks(
  overrides: {
    commentsLoading?: boolean;
    subtasksLoading?: boolean;
    historyLoading?: boolean;
  } = {},
) {
  vi.mocked(useVocComments).mockReturnValue({
    isLoading: overrides.commentsLoading ?? false,
    data: [],
  } as unknown as ReturnType<typeof useVocComments>);

  vi.mocked(useVocSubtasks).mockReturnValue({
    isLoading: overrides.subtasksLoading ?? false,
    data: [],
  } as unknown as ReturnType<typeof useVocSubtasks>);

  vi.mocked(useVocHistory).mockReturnValue({
    isLoading: overrides.historyLoading ?? false,
    data: [],
  } as unknown as ReturnType<typeof useVocHistory>);
}

describe('VocActionSection — LoadingState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('comments.isLoading=true → Comment 탭에 LoadingState 렌더', () => {
    setupMocks({ commentsLoading: true });
    render(<VocActionSection {...baseProps} />);
    // Comment tab is default; LoadingState renders a skeleton
    expect(screen.getByRole('status')).toBeInTheDocument();
    // VocComment section (data-testid="drawer-comments") should NOT be present
    expect(screen.queryByTestId('drawer-comments')).not.toBeInTheDocument();
  });

  it('comments.isLoading=false → Comment 탭에 VocComment(빈 댓글 메시지) 렌더', () => {
    setupMocks({ commentsLoading: false });
    render(<VocActionSection {...baseProps} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByTestId('drawer-comments')).toBeInTheDocument();
  });

  it('subtasks.isLoading=true → Subtask 탭 선택 시 LoadingState 렌더', async () => {
    const user = userEvent.setup();
    setupMocks({ subtasksLoading: true });
    render(<VocActionSection {...baseProps} />);
    await user.click(screen.getByRole('tab', { name: 'Subtask' }));
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
