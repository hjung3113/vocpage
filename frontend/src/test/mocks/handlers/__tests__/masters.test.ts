/**
 * MSW masters handler smoke tests — Zod parse round-trip on each endpoint.
 * Mirrors voc-list-filters.test.ts pattern (setupServer + fetch + assert).
 */
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { mastersHandlers } from '../masters';
import {
  AssigneeListResponse,
  TagListResponse,
  VocTypeListResponse,
} from '../../../../../../shared/contracts/master';

const server = setupServer(...mastersHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers(...mastersHandlers));
afterAll(() => server.close());

describe('MSW GET /api/masters/* — Zod parse round-trip', () => {
  it('assignees: 응답이 AssigneeListResponse 스키마를 통과한다', async () => {
    const res = await fetch(`${window.location.origin}/api/masters/assignees`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const parsed = AssigneeListResponse.parse(body);
    expect(parsed.rows.length).toBeGreaterThan(0);
  });

  it('tags: 응답이 TagListResponse 스키마를 통과한다', async () => {
    const res = await fetch(`${window.location.origin}/api/masters/tags`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const parsed = TagListResponse.parse(body);
    expect(parsed.rows.length).toBeGreaterThanOrEqual(8);
  });

  it('voc-types: 응답이 VocTypeListResponse 스키마를 통과한다', async () => {
    const res = await fetch(`${window.location.origin}/api/masters/voc-types`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const parsed = VocTypeListResponse.parse(body);
    expect(parsed.rows.length).toBeGreaterThanOrEqual(5);
  });
});
