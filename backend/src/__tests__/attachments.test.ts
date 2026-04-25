import request from 'supertest';
import { createTestApp } from './helpers/app';
import { createTestDb, insertFixtures, TestFixtures } from './helpers/db';
import type { Pool } from 'pg';

describe('Attachment endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let pool: Pool;
  let fixtures: TestFixtures;
  let vocId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const db = await createTestDb();
    pool = db.pool;
    fixtures = await insertFixtures(pool);
    app = createTestApp(pool);

    const result = await pool.query(
      `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
       VALUES ('Test VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual') RETURNING id`,
      [fixtures.userId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
    );
    vocId = result.rows[0].id as string;
  });

  // ── Unauthenticated ────────────────────────────────────────────────────────

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get(`/api/vocs/${vocId}/attachments`);
    expect(res.status).toBe(401);
  });

  // ── Upload ─────────────────────────────────────────────────────────────────

  describe('POST /api/vocs/:vocId/attachments', () => {
    it('rejects unsupported file type → 415', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .post(`/api/vocs/${vocId}/attachments`)
        .attach('file', Buffer.from('fake-pdf'), {
          filename: 'test.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(415);
    });

    it('uploads a valid image → 201', async () => {
      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .post(`/api/vocs/${vocId}/attachments`)
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'test.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(201);
      expect(res.body.filename).toBe('test.png');
      expect(res.body.mime_type).toBe('image/png');
      expect(res.body.voc_id).toBe(vocId);
    });

    it('rejects when attachment count exceeds 5 → 400', async () => {
      // Create a fresh VOC for this test to avoid state contamination
      const result = await pool.query(
        `INSERT INTO vocs (title, body, status, priority, author_id, system_id, menu_id, voc_type_id, source)
         VALUES ('Attach Test VOC', 'body', '접수', 'medium', $1, $2, $3, $4, 'manual') RETURNING id`,
        [fixtures.managerId, fixtures.systemId, fixtures.menuId, fixtures.vocTypeId],
      );
      const limitVocId = result.rows[0].id as string;

      // Insert 5 attachments directly
      for (let i = 0; i < 5; i++) {
        await pool.query(
          `INSERT INTO attachments (voc_id, uploader_id, filename, mime_type, size_bytes, storage_path)
           VALUES ($1, $2, $3, 'image/png', 100, $4)`,
          [limitVocId, fixtures.managerId, `file${i}.png`, `${limitVocId}/file${i}.png`],
        );
      }

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent
        .post(`/api/vocs/${limitVocId}/attachments`)
        .attach('file', Buffer.from('extra-image'), {
          filename: 'extra.png',
          contentType: 'image/png',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('ATTACHMENT_LIMIT_EXCEEDED');
    });
  });

  // ── DELETE ─────────────────────────────────────────────────────────────────

  describe('DELETE /api/vocs/:vocId/attachments/:attachmentId', () => {
    it('Uploader can delete their attachment → 200', async () => {
      const insertResult = await pool.query(
        `INSERT INTO attachments (voc_id, uploader_id, filename, mime_type, size_bytes, storage_path)
         VALUES ($1, $2, 'del.png', 'image/png', 10, $3) RETURNING id`,
        [vocId, fixtures.managerId, `${vocId}/del.png`],
      );
      const attachmentId = insertResult.rows[0].id as string;

      const agent = request.agent(app);
      await agent.post('/api/auth/mock-login').send({ role: 'manager' });

      const res = await agent.delete(`/api/vocs/${vocId}/attachments/${attachmentId}`);
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });
});
