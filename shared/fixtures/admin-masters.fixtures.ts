/**
 * @module shared/fixtures/admin-masters.fixtures
 *
 * External Masters admin fixtures for:
 *  - FE MSW handlers (frontend/src/test/mocks/handlers/admin-masters.ts)
 *  - BE Jest tests (mock service injection)
 *
 * Spec: requirements.md §16.3, external-masters.md §0/§6/§8
 * Covers: live / snapshot / cold-start modes + cooldown state
 */

export const MASTER_LOADED_AT = '2026-04-26T12:36:07.262Z';
export const MASTER_COOLDOWN_UNTIL = '2026-04-26T12:41:07.262Z';

// ─── Status fixtures ──────────────────────────────────────────────────────────

/** Live mode — all 3 sources freshly loaded, no cooldown */
export const MASTER_STATUS_LIVE = {
  loaded_at: MASTER_LOADED_AT,
  cooldown_until: null,
  mode: 'live' as const,
  sources: {
    equipment: { loaded_at: MASTER_LOADED_AT },
    db:        { loaded_at: MASTER_LOADED_AT },
    program:   { loaded_at: MASTER_LOADED_AT },
  },
};

/** Snapshot mode — loaded from disk fallback, no cooldown */
export const MASTER_STATUS_SNAPSHOT = {
  loaded_at: MASTER_LOADED_AT,
  cooldown_until: null,
  mode: 'snapshot' as const,
  sources: {
    equipment: { loaded_at: MASTER_LOADED_AT, kept_loaded_at: MASTER_LOADED_AT },
    db:        { loaded_at: MASTER_LOADED_AT, kept_loaded_at: MASTER_LOADED_AT },
    program:   { loaded_at: MASTER_LOADED_AT },
  },
};

/** Cold-start mode — no snapshot, all fields unverified */
export const MASTER_STATUS_COLD = {
  loaded_at: null,
  cooldown_until: null,
  mode: 'cold' as const,
  sources: {
    equipment: null,
    db:        null,
    program:   null,
  },
};

/** Live mode with active cooldown */
export const MASTER_STATUS_WITH_COOLDOWN = {
  ...MASTER_STATUS_LIVE,
  cooldown_until: MASTER_COOLDOWN_UNTIL,
};

// ─── Refresh result fixtures ──────────────────────────────────────────────────

/** Successful refresh */
export const MASTER_REFRESH_OK = {
  swapped: true,
  loaded_at: MASTER_LOADED_AT,
  sources: {
    equipment: { loaded_at: MASTER_LOADED_AT },
    db:        { loaded_at: MASTER_LOADED_AT },
  },
};

/** Failed refresh — atomic swap rejected, kept_loaded_at preserved */
export const MASTER_REFRESH_FAILED = {
  swapped: false,
  loaded_at: MASTER_LOADED_AT,
  sources: {
    equipment: { loaded_at: MASTER_LOADED_AT },
    db:        { loaded_at: MASTER_LOADED_AT },
  },
};

// ─── Error fixtures ───────────────────────────────────────────────────────────

export const MASTER_ERROR_RATE_LIMITED = {
  code: 'RATE_LIMITED',
  message: '쿨다운 중입니다. 5분 후 다시 시도하세요.',
  details: {
    cooldown_until: MASTER_COOLDOWN_UNTIL,
    kept_loaded_at: MASTER_LOADED_AT,
  },
};

export const MASTER_ERROR_UNAVAILABLE = {
  code: 'EXTERNAL_MASTER_UNAVAILABLE',
  message: '외부 마스터 로드 실패: MSSQL 연결 오류',
  details: {
    kept_loaded_at: MASTER_LOADED_AT,
  },
};
