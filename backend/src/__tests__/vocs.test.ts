import request from 'supertest';
import { createTestApp } from './helpers/app';

/**
 * VOC CRUD + permission tests — TDD style.
 * Unimplemented routes are marked it.todo() and will be filled in when the route lands.
 */
describe('VOC endpoints', () => {
  describe('GET /api/vocs', () => {
    it.todo('returns 401 when not authenticated');
    it.todo('returns 200 with paginated list for authenticated user');
    it.todo('filters by status query param');
    it.todo('filters by systemId query param');
  });

  describe('POST /api/vocs', () => {
    it.todo('returns 401 when not authenticated');
    it.todo('returns 201 with created VOC for valid body');
    it.todo('returns 400 for missing required fields');
  });

  describe('PATCH /api/vocs/:id/status', () => {
    it.todo('returns 401 when not authenticated');
    it.todo('returns 403 when user role tries to change status (manager/admin only)');
    it.todo('returns 200 when manager changes status following valid transition');
    it.todo('returns 422 for invalid status transition');
  });

  describe('DELETE /api/vocs/:id', () => {
    it.todo('returns 401 when not authenticated');
    it.todo('returns 403 when manager tries to delete (admin-only soft delete)');
    it.todo('returns 200 when admin soft-deletes');
    it.todo('deleted VOC excluded from GET /api/vocs unless includeDeleted=true (admin only)');
  });
});

// Keep a concrete smoke test to ensure the test app + supertest wiring works
describe('VOC route auth smoke', () => {
  it('unknown VOC route returns 404 (sanity check)', async () => {
    const app = createTestApp();
    const res = await request(app).get('/api/vocs');
    expect(res.status).toBe(404);
  });
});
