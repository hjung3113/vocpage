import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import type { Pool } from 'pg';

async function createParentVoc(
  pool: Pool,
  fixtures: TestFixtures,
  opts: { issueCode?: string } = {},
): Promise<{ id: string; issue_code: string }> {
  const issueCode = opts.issueCode ?? `TEST-2026-${Math.floor(Math.random() * 100000)}`;
  const result = await pool.query(
    `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source, sequence_no, issue_code)
     VALUES ('Parent VOC', 'parent body', '접수', 'medium', $1, $2, $3, $4, 'manual', 1, $5)
     RETURNING id, issue_code`,
    [fixtures.userId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId, issueCode],
  );
  return { id: result.rows[0].id as string, issue_code: result.rows[0].issue_code as string };
}

describe('Sub-task endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let pool: Pool;
  let fixtures: TestFixtures;

  beforeAll(async () => {
    const db = await createTestDb();
    pool = db.pool;
    fixtures = await insertFixtures(pool);
    app = createTestApp(pool);
  });

  // ── Authorization ─────────────────────────────────────────────────────────

  describe('Authorization', () => {
    it('GET /vocs/:id/subtasks → 401 when unauthenticated', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const res = await request(app).get(`/api/vocs/${parent.id}/subtasks`);
      expect(res.status).toBe(401);
    });

    it('POST /vocs/:id/subtasks → 401 when unauthenticated', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const res = await request(app)
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 'st', voc_type_id: fixtures.vocTypeId });
      expect(res.status).toBe(401);
    });
  });

  // ── GET /vocs/:id/subtasks ───────────────────────────────────────────────

  describe('GET /api/vocs/:id/subtasks', () => {
    it('Sub-task 없는 VOC → empty array', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get(`/api/vocs/${parent.id}/subtasks`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('Sub-task 2건 생성 → 2건 반환, issue_code 형식 검증', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 'sub1', voc_type_id: fixtures.vocTypeId });
      await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 'sub2', voc_type_id: fixtures.vocTypeId });

      const res = await agent.get(`/api/vocs/${parent.id}/subtasks`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      const codes = res.body.map((r: { issue_code: string }) => r.issue_code).sort();
      expect(codes).toEqual([`${parent.issue_code}-1`, `${parent.issue_code}-2`]);
    });

    it('soft-deleted Sub-task 미포함', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const r1 = await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 'keep', voc_type_id: fixtures.vocTypeId });
      const r2 = await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 'drop', voc_type_id: fixtures.vocTypeId });

      await pool.query(`UPDATE vocs SET deleted_at = now() WHERE id = $1`, [r2.body.id]);

      const res = await agent.get(`/api/vocs/${parent.id}/subtasks`);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(r1.body.id);
    });

    it('부모 VOC 없으면 → 404', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get('/api/vocs/00000000-0000-0000-0000-000000000099/subtasks');
      expect(res.status).toBe(404);
    });
  });

  // ── POST /vocs/:id/subtasks ───────────────────────────────────────────────

  describe('POST /api/vocs/:id/subtasks', () => {
    it('정상 생성 → 201, issue_code = {parent.issue_code}-1', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 'first sub', voc_type_id: fixtures.vocTypeId });
      expect(res.status).toBe(201);
      expect(res.body.issue_code).toBe(`${parent.issue_code}-1`);
      expect(res.body.parent_id).toBe(parent.id);
      expect(res.body.system_id).toBe(fixtures.systemId);
      expect(res.body.menu_id).toBe(fixtures.menuId);
    });

    it('2번 생성 → -1, -2 (삭제 후 번호 재사용 금지)', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const r1 = await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 's1', voc_type_id: fixtures.vocTypeId });
      // soft delete first one
      await pool.query(`UPDATE vocs SET deleted_at = now() WHERE id = $1`, [r1.body.id]);

      const r2 = await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 's2', voc_type_id: fixtures.vocTypeId });
      // next_n must include soft-deleted → 2, not 1
      expect(r2.body.issue_code).toBe(`${parent.issue_code}-2`);
    });

    it('1레벨 제한: Sub-task에 Sub-task 생성 → 400', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const sub = await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 's', voc_type_id: fixtures.vocTypeId });

      const res = await agent
        .post(`/api/vocs/${sub.body.id}/subtasks`)
        .send({ title: 'nested', voc_type_id: fixtures.vocTypeId });
      expect(res.status).toBe(400);
    });

    it('필수 필드(title) 누락 → 400', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ voc_type_id: fixtures.vocTypeId });
      expect(res.status).toBe(400);
    });

    it('필수 필드(voc_type_id) 누락 → 400', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.post(`/api/vocs/${parent.id}/subtasks`).send({ title: 'x' });
      expect(res.status).toBe(400);
    });

    it('부모 VOC 없으면 → 404', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .post('/api/vocs/00000000-0000-0000-0000-000000000099/subtasks')
        .send({ title: 'x', voc_type_id: fixtures.vocTypeId });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE cascade ────────────────────────────────────────────────────────

  describe('DELETE cascade', () => {
    it('부모 VOC soft delete → Sub-task도 deleted_at 세팅', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'admin' });

      const sub = await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 's1', voc_type_id: fixtures.vocTypeId });

      const del = await agent.delete(`/api/vocs/${parent.id}`);
      expect(del.status).toBe(204);

      const r = await pool.query(`SELECT deleted_at FROM vocs WHERE id = $1`, [sub.body.id]);
      expect(r.rows[0].deleted_at).not.toBeNull();
    });
  });

  // ── C2: Sub-task 삭제 권한 ─────────────────────────────────────────────────

  describe('C2: Sub-task 삭제 권한', () => {
    it('User가 본인이 만든 Sub-task 삭제 → 204', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const adminAgent = request.agent(app);
      await adminAgent.post('/api/auth/mock-login').send({ role: 'admin' });

      // Create sub-task as user
      const userAgent = request.agent(app);
      await userAgent.post('/api/auth/mock-login').send({ role: 'user' });
      const sub = await userAgent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 'my sub', voc_type_id: fixtures.vocTypeId });
      expect(sub.status).toBe(201);

      const del = await userAgent.delete(`/api/vocs/${sub.body.id}`);
      expect(del.status).toBe(204);
    });

    it('User가 타인이 만든 Sub-task 삭제 → 403', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const adminAgent = request.agent(app);
      await adminAgent.post('/api/auth/mock-login').send({ role: 'admin' });

      // Create sub-task as admin (author_id = adminId)
      const sub = await adminAgent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 'admin sub', voc_type_id: fixtures.vocTypeId });
      expect(sub.status).toBe(201);

      // Try to delete as different user
      const userAgent = request.agent(app);
      await userAgent.post('/api/auth/mock-login').send({ role: 'user' });
      const del = await userAgent.delete(`/api/vocs/${sub.body.id}`);
      expect(del.status).toBe(403);
    });
  });

  // ── M2: Sub-task system_id/menu_id 변경 차단 ──────────────────────────────

  describe('M2: Sub-task system_id/menu_id 변경 차단', () => {
    it('Sub-task에 system_id 변경 시도 → 400', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const sub = await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 'sub', voc_type_id: fixtures.vocTypeId });
      expect(sub.status).toBe(201);

      const res = await agent
        .patch(`/api/vocs/${sub.body.id}`)
        .send({ system_id: fixtures.systemId });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('SUBTASK_SYSTEM_MENU_IMMUTABLE');
    });

    it('Sub-task에 menu_id 변경 시도 → 400', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const sub = await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 'sub', voc_type_id: fixtures.vocTypeId });
      expect(sub.status).toBe(201);

      const res = await agent.patch(`/api/vocs/${sub.body.id}`).send({ menu_id: fixtures.menuId });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('SUBTASK_SYSTEM_MENU_IMMUTABLE');
    });
  });

  // ── GET /vocs/:id/incomplete-subtasks ────────────────────────────────────

  describe('GET /api/vocs/:id/incomplete-subtasks', () => {
    it('미완료 0건 → count: 0', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.get(`/api/vocs/${parent.id}/incomplete-subtasks`);
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
    });

    it('미완료 2건 → count: 2', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 's1', voc_type_id: fixtures.vocTypeId });
      await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 's2', voc_type_id: fixtures.vocTypeId });

      const res = await agent.get(`/api/vocs/${parent.id}/incomplete-subtasks`);
      expect(res.body.count).toBe(2);
    });

    it('완료된 Sub-task는 카운트에서 제외', async () => {
      const parent = await createParentVoc(pool, fixtures);
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const r1 = await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 's1', voc_type_id: fixtures.vocTypeId });
      await agent
        .post(`/api/vocs/${parent.id}/subtasks`)
        .send({ title: 's2', voc_type_id: fixtures.vocTypeId });

      // mark first as 완료
      await pool.query(`UPDATE vocs SET status = '완료' WHERE id = $1`, [r1.body.id]);

      const res = await agent.get(`/api/vocs/${parent.id}/incomplete-subtasks`);
      expect(res.body.count).toBe(1);
    });
  });
});
