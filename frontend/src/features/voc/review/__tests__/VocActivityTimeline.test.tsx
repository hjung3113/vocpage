import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VocActivityTimeline, buildTimeline } from '../ui/VocActivityTimeline';
import type { VocHistoryEntry, Comment } from '@contracts/voc';

const HIST: VocHistoryEntry[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    voc_id: 'aaaaaaaa-0000-4000-8000-000000000001',
    field: 'status',
    old_value: '접수',
    new_value: '검토중',
    changed_by: 'aaaaaaaa-0000-4000-8000-000000000099',
    changed_at: '2026-05-01T10:00:00Z',
  },
];
const COMM: Comment[] = [
  {
    id: '22222222-2222-4222-8222-222222222222',
    voc_id: 'aaaaaaaa-0000-4000-8000-000000000001',
    author_id: 'aaaaaaaa-0000-4000-8000-000000000088',
    body: '추가 확인 부탁드립니다',
    created_at: '2026-05-02T10:00:00Z',
    updated_at: '2026-05-02T10:00:00Z',
  },
];

describe('VocActivityTimeline', () => {
  it('history + comments 머지 후 시각 역순 정렬', () => {
    const items = buildTimeline(HIST, COMM);
    expect(items).toHaveLength(2);
    expect(items[0]?.kind).toBe('comment'); // newer first
    expect(items[1]?.kind).toBe('history');
  });

  it('렌더 시 comment 본문과 history field 라벨이 모두 보임', () => {
    render(<VocActivityTimeline history={HIST} comments={COMM} loading={false} />);
    expect(screen.getByTestId('voc-activity-timeline')).toBeInTheDocument();
    expect(screen.getByText(/추가 확인 부탁드립니다/)).toBeInTheDocument();
    expect(screen.getByText(/접수.*검토중/)).toBeInTheDocument();
  });

  it('빈 상태 메시지', () => {
    render(<VocActivityTimeline history={[]} comments={[]} loading={false} />);
    expect(screen.getByText('활동이 없습니다.')).toBeInTheDocument();
  });
});
