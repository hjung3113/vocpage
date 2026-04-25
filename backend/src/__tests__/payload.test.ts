import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import type { Pool } from 'pg';

async function createCompletedVoc(
  pool: Pool,
  fixtures: TestFixtures,
  opts: { assigneeId?: string; status?: string } = {},
): Promise<string> {
  const status = opts.status ?? '완료';
  const assigneeId = opts.assigneeId ?? fixtures.managerId;
  const result = await pool.query(
    `INSERT INTO vocs (title, body, status, priority, author_id, assignee_id, system_id, menu_id, voc_type_id, source)
     VALUES ('Test', 'body', $1, 'medium', $2, $3, $4, $5, $6, 'manual') RETURNING id`,
    [status, fixtures.userId, assigneeId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
  );
  return result.rows[0].id as string;
}

const BASE_PAYLOAD = {
  equipment: 'PUMP-1',
  maker: 'ACME',
  model: 'M100',
  process: 'P1',
  symptom: '진동 발생',
  root_cause: '베어링 마모',
  resolution: '베어링 교체',
};

describe('VOC Payload endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let pool: Pool;
  let fixtures: TestFixtures;

  beforeAll(async () => {
    const db = await createTestDb();
    pool = db.pool;
    fixtures = await insertFixtures(pool);
    app = createTestApp(pool);
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  describe('Authorization', () => {
    it('POST /payload → 401 when unauthenticated', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const res = await request(app).post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      expect(res.status).toBe(401);
    });

    it('PATCH /payload-draft → 401 when unauthenticated', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const res = await request(app).patch(`/api/vocs/${vocId}/payload-draft`).send({ draft: {} });
      expect(res.status).toBe(401);
    });

    it('GET /payload-history → 401 when unauthenticated', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const res = await request(app).get(`/api/vocs/${vocId}/payload-history`);
      expect(res.status).toBe(401);
    });

    it('POST /payload-review → 401 when unauthenticated', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const res = await request(app)
        .post(`/api/vocs/${vocId}/payload-review`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(401);
    });

    it('POST /payload-delete-request → 401 when unauthenticated', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const res = await request(app).post(`/api/vocs/${vocId}/payload-delete-request`);
      expect(res.status).toBe(401);
    });

    it('POST /payload → 403 for User role', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      expect(res.status).toBe(403);
    });
  });

  // ── POST /payload ─────────────────────────────────────────────────────────

  describe('POST /api/vocs/:id/payload', () => {
    it('Manager submits payload on 완료 VOC → 200, history row created, review_status=unverified', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      expect(res.status).toBe(200);

      const hist = await pool.query(
        `SELECT * FROM voc_payload_history WHERE voc_id = $1 AND is_current = true`,
        [vocId],
      );
      expect(hist.rowCount).toBe(1);

      const voc = await pool.query(`SELECT review_status FROM vocs WHERE id = $1`, [vocId]);
      expect(voc.rows[0].review_status).toBe('unverified');
    });

    it('Cannot submit payload on 접수 VOC → 400', async () => {
      const vocId = await createCompletedVoc(pool, fixtures, { status: '접수' });
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      expect(res.status).toBe(400);
    });

    it('Missing required fields → 400', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post(`/api/vocs/${vocId}/payload`).send({ equipment: 'X' }); // missing symptom, root_cause, resolution
      expect(res.status).toBe(400);
    });

    it('is_current invariant: 2회 제출 후 is_current=true row가 1건만 존재', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      await agent.post(`/api/vocs/${vocId}/payload`).send({ ...BASE_PAYLOAD, symptom: '두번째' });

      const r = await pool.query(
        `SELECT COUNT(*)::int AS n FROM voc_payload_history WHERE voc_id = $1 AND is_current = true`,
        [vocId],
      );
      expect(r.rows[0].n).toBe(1);
    });

    it('Manager (assignee 아님) → 403', async () => {
      // assignee를 admin(다른 사용자)로 둔 VOC를 생성 후, 일반 manager 세션으로 제출 시도.
      const vocId = await createCompletedVoc(pool, fixtures, { assigneeId: fixtures.adminId });
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      expect(res.status).toBe(403);
    });

    it('embed_stale: approved VOC에 재제출하면 embed_stale=true', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      // self-review 방지: admin 세션으로 리뷰
      const reviewer = request.agent(app);
      await reviewer.post('/api/auth/mock-login').send({ role: 'admin' });
      await reviewer.post(`/api/vocs/${vocId}/payload-review`).send({ decision: 'approved' });

      // 재진입(처리중 → 완료)을 위해 status를 처리중으로 한 번 내렸다가 다시 완료로 올릴 수 없으므로
      // 직접 status='완료'(이미 완료)에 또 한 번 제출(허용됨).
      const res = await agent
        .post(`/api/vocs/${vocId}/payload`)
        .send({ ...BASE_PAYLOAD, symptom: '수정' });
      expect(res.status).toBe(200);

      const v = await pool.query(`SELECT embed_stale FROM vocs WHERE id = $1`, [vocId]);
      expect(v.rows[0].embed_stale).toBe(true);
    });

    it('deletion approve 후 재제출 가능', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      // self-review 방지: admin 세션으로 리뷰
      const reviewer = request.agent(app);
      await reviewer.post('/api/auth/mock-login').send({ role: 'admin' });
      await reviewer.post(`/api/vocs/${vocId}/payload-review`).send({ decision: 'approved' });
      await agent.post(`/api/vocs/${vocId}/payload-delete-request`);
      // 재제출 후 manager가 다시 제출 → admin이 리뷰
      await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      await reviewer.post(`/api/vocs/${vocId}/payload-review`).send({ decision: 'approved' });

      // review_status=NULL 상태에서 다시 제출 가능해야 함.
      const res = await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      expect(res.status).toBe(200);

      const v = await pool.query(`SELECT review_status FROM vocs WHERE id = $1`, [vocId]);
      expect(v.rows[0].review_status).toBe('unverified');
    });

    it('처리중 VOC에 status=완료 + payload 동시 전환 → 200', async () => {
      const vocId = await createCompletedVoc(pool, fixtures, { status: '처리중' });
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .post(`/api/vocs/${vocId}/payload`)
        .send({ ...BASE_PAYLOAD, status: '완료' });
      expect(res.status).toBe(200);

      const v = await pool.query(`SELECT status, review_status FROM vocs WHERE id = $1`, [vocId]);
      expect(v.rows[0].status).toBe('완료');
      expect(v.rows[0].review_status).toBe('unverified');
    });
  });

  // ── PATCH /payload-draft ──────────────────────────────────────────────────

  describe('PATCH /api/vocs/:id/payload-draft', () => {
    it('Manager saves draft → 200, structured_payload_draft updated', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .patch(`/api/vocs/${vocId}/payload-draft`)
        .send({ draft: { symptom: '임시 작성중' } });
      expect(res.status).toBe(200);

      const r = await pool.query(`SELECT structured_payload_draft FROM vocs WHERE id = $1`, [
        vocId,
      ]);
      const draft = r.rows[0].structured_payload_draft;
      expect(draft).not.toBeNull();
      expect((draft as { symptom: string }).symptom).toBe('임시 작성중');
    });

    it('Non-existent VOC → 404', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent
        .patch('/api/vocs/00000000-0000-0000-0000-000000000099/payload-draft')
        .send({ draft: {} });
      expect(res.status).toBe(404);
    });

    it('접수 상태 VOC draft → 400', async () => {
      const vocId = await createCompletedVoc(pool, fixtures, { status: '접수' });
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const res = await agent
        .patch(`/api/vocs/${vocId}/payload-draft`)
        .send({ draft: { symptom: 'x' } });
      expect(res.status).toBe(400);
    });

    it('Manager (non-assignee) PATCH /payload-draft → 403', async () => {
      // VOC with adminId as assignee; manager (managerId) should be forbidden.
      const vocId = await createCompletedVoc(pool, fixtures, { assigneeId: fixtures.adminId });
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .patch(`/api/vocs/${vocId}/payload-draft`)
        .send({ draft: { symptom: '임시' } });
      expect(res.status).toBe(403);
    });
  });

  // ── GET /payload-history ──────────────────────────────────────────────────

  describe('GET /api/vocs/:id/payload-history', () => {
    it('Returns 2 rows after 2 submissions, ordered DESC', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      await new Promise((r) => setTimeout(r, 10));
      await agent
        .post(`/api/vocs/${vocId}/payload`)
        .send({ ...BASE_PAYLOAD, symptom: '두번째 제출' });

      const res = await agent.get(`/api/vocs/${vocId}/payload-history`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('User → 403', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'user' });

      const res = await agent.get(`/api/vocs/${vocId}/payload-history`);
      expect(res.status).toBe(403);
    });
  });

  // ── POST /payload-review ──────────────────────────────────────────────────

  describe('POST /api/vocs/:id/payload-review', () => {
    it('approve unverified → review_status=approved, history.final_state=approved', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);

      // self-review 방지: admin 세션으로 리뷰
      const reviewer = request.agent(app);
      await reviewer.post('/api/auth/mock-login').send({ role: 'admin' });
      const res = await reviewer
        .post(`/api/vocs/${vocId}/payload-review`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(200);

      const v = await pool.query(`SELECT review_status FROM vocs WHERE id = $1`, [vocId]);
      expect(v.rows[0].review_status).toBe('approved');

      const h = await pool.query(
        `SELECT final_state FROM voc_payload_history WHERE voc_id = $1 AND is_current = true`,
        [vocId],
      );
      expect(h.rows[0].final_state).toBe('approved');
    });

    it('reject unverified → review_status=rejected, history.is_current=false, final_state=rejected', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);

      // self-review 방지: admin 세션으로 리뷰
      const reviewer = request.agent(app);
      await reviewer.post('/api/auth/mock-login').send({ role: 'admin' });
      const res = await reviewer
        .post(`/api/vocs/${vocId}/payload-review`)
        .send({ decision: 'rejected', comment: '근거 부족' });
      expect(res.status).toBe(200);

      const v = await pool.query(`SELECT review_status FROM vocs WHERE id = $1`, [vocId]);
      expect(v.rows[0].review_status).toBe('rejected');

      const h = await pool.query(
        `SELECT final_state, is_current FROM voc_payload_history WHERE voc_id = $1`,
        [vocId],
      );
      expect(h.rows[0].final_state).toBe('rejected');
      expect(h.rows[0].is_current).toBe(true);
    });

    it('review_status=null VOC → 400', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .post(`/api/vocs/${vocId}/payload-review`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(400);
    });

    it('approve pending_deletion → review_status=null, structured_payload=null, final_state=deleted', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      // self-review 방지: admin 세션으로 리뷰
      const reviewer = request.agent(app);
      await reviewer.post('/api/auth/mock-login').send({ role: 'admin' });
      await reviewer.post(`/api/vocs/${vocId}/payload-review`).send({ decision: 'approved' });
      await agent.post(`/api/vocs/${vocId}/payload-delete-request`);

      const res = await reviewer
        .post(`/api/vocs/${vocId}/payload-review`)
        .send({ decision: 'approved' });
      expect(res.status).toBe(200);

      const v = await pool.query(
        `SELECT review_status, structured_payload FROM vocs WHERE id = $1`,
        [vocId],
      );
      expect(v.rows[0].review_status).toBeNull();
      expect(v.rows[0].structured_payload).toBeNull();

      const h = await pool.query(
        `SELECT final_state FROM voc_payload_history WHERE voc_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
        [vocId],
      );
      expect(h.rows[0].final_state).toBe('deleted');
    });

    it('reject pending_deletion → review_status=approved (원복)', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      // self-review 방지: admin 세션으로 리뷰
      const reviewer = request.agent(app);
      await reviewer.post('/api/auth/mock-login').send({ role: 'admin' });
      await reviewer.post(`/api/vocs/${vocId}/payload-review`).send({ decision: 'approved' });
      await agent.post(`/api/vocs/${vocId}/payload-delete-request`);

      const res = await reviewer
        .post(`/api/vocs/${vocId}/payload-review`)
        .send({ decision: 'rejected' });
      expect(res.status).toBe(200);

      const v = await pool.query(`SELECT review_status FROM vocs WHERE id = $1`, [vocId]);
      expect(v.rows[0].review_status).toBe('approved');
    });
  });

  // ── POST /payload-delete-request ──────────────────────────────────────────

  describe('POST /api/vocs/:id/payload-delete-request', () => {
    it('approved VOC → 200, review_status=pending_deletion', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);
      // self-review 방지: admin 세션으로 리뷰
      const reviewer = request.agent(app);
      await reviewer.post('/api/auth/mock-login').send({ role: 'admin' });
      await reviewer.post(`/api/vocs/${vocId}/payload-review`).send({ decision: 'approved' });

      const res = await agent.post(`/api/vocs/${vocId}/payload-delete-request`);
      expect(res.status).toBe(200);

      const v = await pool.query(`SELECT review_status FROM vocs WHERE id = $1`, [vocId]);
      expect(v.rows[0].review_status).toBe('pending_deletion');
    });

    it('unverified VOC → 400', async () => {
      const vocId = await createCompletedVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent.post(`/api/vocs/${vocId}/payload`).send(BASE_PAYLOAD);

      const res = await agent.post(`/api/vocs/${vocId}/payload-delete-request`);
      expect(res.status).toBe(400);
    });
  });
});
