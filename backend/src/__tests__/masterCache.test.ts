import fs from 'fs';
import os from 'os';
import path from 'path';
import { masterCache, reset } from '../services/masterCache';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'master-cache-'));
}

function writeStubs(dir: string): void {
  fs.writeFileSync(
    path.join(dir, 'equipment-stub.json'),
    JSON.stringify({
      equipment: ['Press-A', 'Lathe-B', 'Mill-C'],
      maker: ['OEM Korea', '기계공업', 'Alpha Tech'],
      model: ['PR-100', 'LT-200', 'ML-300'],
      process: ['용접', '절삭', '조립'],
    }),
    'utf8',
  );
  fs.writeFileSync(
    path.join(dir, 'programs.json'),
    JSON.stringify(['ERP_BATCH_DAILY', 'MES_SYNC_HOURLY', 'REPORT_WEEKLY']),
    'utf8',
  );
}

function writeSnapshot(dir: string, state: object): void {
  fs.writeFileSync(path.join(dir, 'snapshot.json'), JSON.stringify(state), 'utf8');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  reset();
});

// 1. init() with valid stub files → mode='live'
it('init() with valid stub files → mode=live', async () => {
  const dir = makeTmpDir();
  writeStubs(dir);

  await masterCache.init(dir);
  const state = masterCache.get();

  expect(state.mode).toBe('live');
  expect(state.equipment).not.toBeNull();
  expect(state.equipment?.equipment).toContain('Press-A');
  expect(state.program?.programs).toContain('ERP_BATCH_DAILY');
  expect(state.db).not.toBeNull();
});

// 2. init() with missing stubs but valid snapshot → mode='snapshot'
it('init() with missing stubs but valid snapshot → mode=snapshot', async () => {
  const dir = makeTmpDir();
  // No stub files — write snapshot only
  writeSnapshot(dir, {
    equipment: {
      equipment: ['Snap-A'],
      maker: [],
      model: [],
      process: [],
      loaded_at: '2026-01-01T00:00:00.000Z',
    },
    db: null,
    program: { programs: ['SNAP_PROG'], loaded_at: '2026-01-01T00:00:00.000Z' },
    mode: 'snapshot',
  });

  await masterCache.init(dir);
  const state = masterCache.get();

  expect(state.mode).toBe('snapshot');
  expect(state.equipment?.equipment).toContain('Snap-A');
});

// 3. init() with nothing → mode='cold_start', get().equipment === null
it('init() with nothing → mode=cold_start, equipment null', async () => {
  const dir = makeTmpDir(); // empty dir — no stubs, no snapshot

  await masterCache.init(dir);
  const state = masterCache.get();

  expect(state.mode).toBe('cold_start');
  expect(state.equipment).toBeNull();
  expect(state.db).toBeNull();
  expect(state.program).toBeNull();
});

// 4. refresh() success → swapped=true, mode='live'
it('refresh() success → swapped=true, mode=live', async () => {
  const dir = makeTmpDir();
  writeStubs(dir);
  await masterCache.init(dir);

  // Advance time past cooldown by temporarily overriding Date.now
  const origNow = Date.now;
  Date.now = () => origNow() + 10 * 60 * 1000; // +10 min

  try {
    const result = await masterCache.refresh('user-1');
    expect(result.swapped).toBe(true);
    if (result.swapped) {
      expect(result.loaded_at).toBeDefined();
      expect(result.sources.equipment).toBeDefined();
      expect(result.sources.db).toBeDefined();
    }
    expect(masterCache.get().mode).toBe('live');
  } finally {
    Date.now = origNow;
  }
});

// 5. refresh() 쿨다운 5분 이내 → RATE_LIMITED throw
it('refresh() within cooldown → throws RATE_LIMITED', async () => {
  const dir = makeTmpDir();
  writeStubs(dir);
  await masterCache.init(dir);

  // First refresh (no prior call so it should succeed)
  await masterCache.refresh('user-2');

  // Second refresh immediately → RATE_LIMITED
  await expect(masterCache.refresh('user-2')).rejects.toMatchObject({
    code: 'RATE_LIMITED',
    retryAfter: expect.any(Number),
  });
});

// 6. refresh() 쿨다운 5분 이후 → 성공
it('refresh() after cooldown expires → success', async () => {
  const dir = makeTmpDir();
  writeStubs(dir);
  await masterCache.init(dir);

  // First refresh
  await masterCache.refresh('user-3');

  // Advance time past cooldown
  const origNow = Date.now;
  Date.now = () => origNow() + 6 * 60 * 1000; // +6 min

  try {
    const result = await masterCache.refresh('user-3');
    expect(result.swapped).toBe(true);
  } finally {
    Date.now = origNow;
  }
});

// 7. verifyPayload() cold_start → 모든 외부 필드 unverified
it('verifyPayload() cold_start → all external fields unverified', async () => {
  const dir = makeTmpDir(); // no stubs, no snapshot
  await masterCache.init(dir);

  const unverified = masterCache.verifyPayload({
    equipment: 'Press-A',
    maker: 'OEM Korea',
    model: 'PR-100',
    process: '용접',
    related_db_tables: ['users'],
    related_jobs: ['nightly_backup'],
    related_sps: ['sp_get_voc'],
    related_programs: ['ERP_BATCH_DAILY'],
  });

  expect(unverified).toContain('equipment');
  expect(unverified).toContain('maker');
  expect(unverified).toContain('model');
  expect(unverified).toContain('process');
  expect(unverified).toContain('related_db_tables');
  expect(unverified).toContain('related_jobs');
  expect(unverified).toContain('related_sps');
  expect(unverified).toContain('related_programs');
});

// 8. verifyPayload() 캐시 있음 + 정확히 일치 → unverified 없음
it('verifyPayload() with cache + exact match → empty unverified', async () => {
  const dir = makeTmpDir();
  writeStubs(dir);
  await masterCache.init(dir);

  const unverified = masterCache.verifyPayload({
    equipment: 'Press-A',
    maker: 'OEM Korea',
    model: 'PR-100',
    process: '용접',
    related_db_tables: ['users'],
    related_jobs: ['nightly_backup'],
    related_sps: ['sp_get_voc'],
    related_programs: ['ERP_BATCH_DAILY'],
  });

  expect(unverified).toHaveLength(0);
});

// 9. verifyPayload() 캐시 있음 + 불일치 → 해당 필드 unverified
it('verifyPayload() with cache + mismatch → relevant fields unverified', async () => {
  const dir = makeTmpDir();
  writeStubs(dir);
  await masterCache.init(dir);

  const unverified = masterCache.verifyPayload({
    equipment: 'Unknown-X',
    maker: 'OEM Korea',
    model: 'INVALID-MODEL',
    process: '용접',
  });

  expect(unverified).toContain('equipment');
  expect(unverified).not.toContain('maker');
  expect(unverified).toContain('model');
  expect(unverified).not.toContain('process');
});

// 10. verifyPayload() normalize (대소문자, 공백) → 올바른 일치
it('verifyPayload() normalizes case and whitespace → correct match', async () => {
  const dir = makeTmpDir();
  writeStubs(dir);
  await masterCache.init(dir);

  const unverified = masterCache.verifyPayload({
    equipment: '  press-a  ', // extra spaces + lowercase
    maker: 'OEM KOREA', // uppercase
    model: 'pr-100', // lowercase
  });

  expect(unverified).toHaveLength(0);
});

// 11. search() prefix 매칭 → 대소문자 무시, 최대 20건
it('search() prefix match → case-insensitive, max 20 results', async () => {
  const dir = makeTmpDir();
  writeStubs(dir);
  await masterCache.init(dir);

  const results = masterCache.search('equipment', 'press');
  expect(results).toContain('Press-A');
  expect(results.length).toBeLessThanOrEqual(20);

  const programResults = masterCache.search('programs', 'ERP');
  expect(programResults).toContain('ERP_BATCH_DAILY');
});

// 12. search() unknown type → 빈 배열
it('search() unknown type → empty array', async () => {
  const dir = makeTmpDir();
  writeStubs(dir);
  await masterCache.init(dir);

  const results = masterCache.search('nonexistent_type', 'foo');
  expect(results).toEqual([]);
});
