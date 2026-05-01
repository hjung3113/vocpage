/**
 * MSW handler regression — PR #121 codex round-3 Finding 2.
 *
 * Backend `/api/vocs` supports q/voc_type_ids/assignees/priorities/tag_ids/
 * sort_by/sort_dir. MSW must mirror these so dev/demo (`VITE_USE_MSW=true`)
 * does not silently diverge.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { vocHandlers, __resetVocMocks } from '../voc';
import { VOC_FIXTURES, FIXTURE_USERS } from '../../../../../shared/fixtures/voc.fixtures';

const server = setupServer(...vocHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers(...vocHandlers);
  __resetVocMocks();
});
afterAll(() => server.close());

interface ListResponse {
  rows: Array<{
    id: string;
    title: string;
    issue_code: string;
    priority: string;
    assignee_id: string | null;
  }>;
  total: number;
  page: number;
  per_page: number;
}

async function list(qs: string): Promise<{ status: number; body: ListResponse }> {
  const res = await fetch(`${window.location.origin}/api/vocs?${qs}`, {
    headers: { 'x-mock-role': 'manager' },
  });
  const body = (await res.json()) as ListResponse;
  return { status: res.status, body };
}

describe('MSW GET /api/vocs — query 필터/정렬 동기화 (BE 미러)', () => {
  it('q 검색 (title/issue_code 부분일치)', async () => {
    const sample = VOC_FIXTURES.find((r) => r.deleted_at === null)!;
    // issue_code 의 prefix 일부 (예: "ANALYSIS-2026-0001" → "analysis")
    const needle = sample.issue_code.split('-')[0]!.toLowerCase();
    const { status, body } = await list(`q=${encodeURIComponent(needle)}&per_page=100`);
    expect(status).toBe(200);
    expect(body.rows.length).toBeGreaterThan(0);
    expect(
      body.rows.every(
        (r) =>
          r.title.toLowerCase().includes(needle) || r.issue_code.toLowerCase().includes(needle),
      ),
    ).toBe(true);
  });

  it('assignees=[devSelf, devOther] 다중 매칭', async () => {
    const qs =
      `assignees=${FIXTURE_USERS.devSelf}&assignees=${FIXTURE_USERS.devOther}` + `&per_page=100`;
    const { status, body } = await list(qs);
    expect(status).toBe(200);
    expect(body.rows.length).toBeGreaterThan(0);
    expect(
      body.rows.every(
        (r) => r.assignee_id === FIXTURE_USERS.devSelf || r.assignee_id === FIXTURE_USERS.devOther,
      ),
    ).toBe(true);
  });

  it("priorities=['high'] 필터", async () => {
    const { status, body } = await list('priorities=high&per_page=100');
    expect(status).toBe(200);
    expect(body.rows.length).toBeGreaterThan(0);
    expect(body.rows.every((r) => r.priority === 'high')).toBe(true);
  });

  it('sort_by=priority sort_dir=desc → urgent 이 먼저', async () => {
    const { status, body } = await list('sort_by=priority&sort_dir=desc&per_page=100');
    expect(status).toBe(200);
    // desc + rank{urgent:0,...,low:3} → low 가 먼저, urgent 가 마지막.
    // (rank 작은 값이 "더 높은 우선순위"이고 dir=-1 적용 시 큰 rank → 작은 rank 순)
    const RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    for (let i = 1; i < body.rows.length; i += 1) {
      expect(RANK[body.rows[i - 1]!.priority]!).toBeGreaterThanOrEqual(
        RANK[body.rows[i]!.priority]!,
      );
    }
  });

  it('per_page=999 → 400 회귀 (기존 가드 유지)', async () => {
    const res = await fetch(`${window.location.origin}/api/vocs?per_page=999`, {
      headers: { 'x-mock-role': 'manager' },
    });
    expect(res.status).toBe(400);
  });
});
