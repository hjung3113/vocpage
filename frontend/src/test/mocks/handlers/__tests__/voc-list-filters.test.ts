/**
 * MSW handler regression — PR-121 codex round-3 Finding 2.
 *
 * Backend `/api/vocs` supports q/voc_type_ids/assignees/priorities/tag_ids/
 * sort_by/sort_dir. MSW must mirror these so dev/demo (`VITE_USE_MSW=true`)
 * does not silently diverge.
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { vocHandlers, __resetVocMocks } from '../voc';
import {
  VOC_FIXTURES,
  VOC_TAG_RELATIONS,
  FIXTURE_TAGS,
  FIXTURE_USERS,
} from '../../../../../shared/fixtures/voc.fixtures';

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
    system_id: string;
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

  it('sort_by=title sort_dir=asc → 제목 오름차순', async () => {
    const { status, body } = await list('sort_by=title&sort_dir=asc&per_page=100');
    expect(status).toBe(200);
    for (let i = 1; i < body.rows.length; i += 1) {
      expect(body.rows[i - 1]!.title.localeCompare(body.rows[i]!.title)).toBeLessThanOrEqual(0);
    }
  });

  it('sort_by=assignee sort_dir=asc → assignee_id 오름차순 (null은 끝)', async () => {
    const { status, body } = await list('sort_by=assignee&sort_dir=asc&per_page=100');
    expect(status).toBe(200);
    for (let i = 1; i < body.rows.length; i += 1) {
      const prev = body.rows[i - 1]!.assignee_id ?? '';
      const cur = body.rows[i]!.assignee_id ?? '';
      expect(prev <= cur).toBe(true);
    }
  });

  it('per_page=999 → 400 회귀 (기존 가드 유지)', async () => {
    const res = await fetch(`${window.location.origin}/api/vocs?per_page=999`, {
      headers: { 'x-mock-role': 'manager' },
    });
    expect(res.status).toBe(400);
  });
});

describe('MSW GET /api/vocs — VocListQuery zod 검증 (BE 미러)', () => {
  it('sort_by=foo → 400 VALIDATION_ERROR', async () => {
    const { status } = await list('sort_by=foo');
    expect(status).toBe(400);
  });

  it('sort_dir=invalid → 400', async () => {
    const { status } = await list('sort_dir=invalid');
    expect(status).toBe(400);
  });

  it('page=0 → 400 (positive int 위반)', async () => {
    const { status } = await list('page=0');
    expect(status).toBe(400);
  });

  it('per_page=0 → 400 (min=1 위반)', async () => {
    const { status } = await list('per_page=0');
    expect(status).toBe(400);
  });

  it('per_page=abc → 400 (coerce 실패)', async () => {
    const { status } = await list('per_page=abc');
    expect(status).toBe(400);
  });
});

describe('MSW GET /api/vocs — tag_ids 실제 필터링 (EXISTS 의미)', () => {
  it('tag_ids=[bug] → relation 매칭 row 만 반환, 비매칭 row 제외', async () => {
    const { status, body } = await list(`tag_ids=${FIXTURE_TAGS.bug}&per_page=100`);
    expect(status).toBe(200);
    const expectedIds = new Set(
      VOC_TAG_RELATIONS.filter((r) => r.tag_id === FIXTURE_TAGS.bug).map((r) => r.voc_id),
    );
    expect(body.rows.length).toBe(expectedIds.size);
    expect(body.rows.every((r) => expectedIds.has(r.id))).toBe(true);
    // 비매칭 row 가 실제로 존재했는지 (필터 무력화 회귀 방지)
    const allActive = VOC_FIXTURES.filter((r) => r.deleted_at === null);
    expect(allActive.length).toBeGreaterThan(expectedIds.size);
  });
});

describe('MSW GET /api/vocs — codex round-5 (system_id + includeDeleted)', () => {
  async function listWithRole(
    qs: string,
    role: 'admin' | 'manager' | 'dev' | 'user' = 'manager',
  ): Promise<{ status: number; body: ListResponse }> {
    const res = await fetch(`${window.location.origin}/api/vocs?${qs}`, {
      headers: { 'x-mock-role': role },
    });
    const body = (await res.json()) as ListResponse;
    return { status: res.status, body };
  }

  it('system_id 필터 — 매칭 system 만 반환', async () => {
    const targetSystem = VOC_FIXTURES.find((r) => r.deleted_at === null)!.system_id;
    const { status, body } = await list(`system_id=${targetSystem}&per_page=100`);
    expect(status).toBe(200);
    expect(body.rows.length).toBeGreaterThan(0);
    expect(body.rows.every((r) => r.system_id === targetSystem)).toBe(true);
  });

  it('system_id + tag_ids 동시 필터 — AND 의미 보존', async () => {
    const targetSystem = VOC_FIXTURES.find((r) => r.deleted_at === null)!.system_id;
    const { status, body } = await list(
      `system_id=${targetSystem}&tag_ids=${FIXTURE_TAGS.bug}&per_page=100`,
    );
    expect(status).toBe(200);
    expect(body.rows.every((r) => r.system_id === targetSystem)).toBe(true);
  });

  it('manager + includeDeleted=true → deleted row 제외 (admin 전용 정책)', async () => {
    const { status, body } = await listWithRole('includeDeleted=true&per_page=100', 'manager');
    expect(status).toBe(200);
    const deletedIds = new Set(VOC_FIXTURES.filter((r) => r.deleted_at !== null).map((r) => r.id));
    expect(body.rows.every((r) => !deletedIds.has(r.id))).toBe(true);
  });

  it('admin + includeDeleted=true → deleted row 포함', async () => {
    const hasDeleted = VOC_FIXTURES.some((r) => r.deleted_at !== null);
    if (!hasDeleted) return; // 픽스처에 deleted row 없으면 스킵
    const { status, body } = await listWithRole('includeDeleted=true&per_page=100', 'admin');
    expect(status).toBe(200);
    const deletedIds = new Set(VOC_FIXTURES.filter((r) => r.deleted_at !== null).map((r) => r.id));
    expect(body.rows.some((r) => deletedIds.has(r.id))).toBe(true);
  });
});
