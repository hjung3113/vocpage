/**
 * external-masters.ts — Wave 3 Phase D (W3-6)
 *
 * In-process global cache for 3 external master data sources:
 *   - equipment: MSSQL (stub via config/masters/equipment-stub.json until schema confirmed)
 *   - db:        MSSQL (stub via config/masters/db-stub.json until schema confirmed)
 *   - program:   config/masters/programs.json — boot-only, not refreshable
 *
 * Spec: requirements.md §16.3, external-masters.md §3/§4/§5/§7/§8
 * ADR 0004 + OQ-2 Option B:
 *   Read   = admin / manager / dev
 *   Refresh= admin / manager only
 *
 * Key invariants:
 *   - Atomic swap: all 3 sources must succeed before cache is replaced.
 *     If any fails, existing memory is preserved (kept_loaded_at).
 *   - Cooldown: 5 min per user ID. Rejects with RATE_LIMITED (429).
 *   - Cold-start: if no snapshot and no live load succeeds → mode='cold',
 *     all fields unverified. Server does NOT fail to boot.
 *   - Snapshot fallback: if boot-time load fails but snapshot file exists
 *     → mode='snapshot'.
 */
import fs from 'fs';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MasterMode = 'live' | 'snapshot' | 'cold';

interface EquipmentCache {
  equipment: string[];
  maker: string[];
  model: string[];
  process: string[];
}

interface DbCache {
  db_tables: string[];
  jobs: string[];
  sps: string[];
}

interface ProgramCache {
  programs: string[];
}

interface SourceEntry<T> {
  data: T;
  loaded_at: string;
  kept_loaded_at?: string;
}

interface MasterCache {
  equipment: SourceEntry<EquipmentCache> | null;
  db: SourceEntry<DbCache> | null;
  program: SourceEntry<ProgramCache> | null;
  mode: MasterMode;
  loaded_at: string | null;
}

export interface MasterStatusResult {
  loaded_at: string | null;
  cooldown_until: string | null;
  mode: MasterMode;
  sources: {
    equipment: { loaded_at: string; kept_loaded_at?: string } | null;
    db: { loaded_at: string; kept_loaded_at?: string } | null;
    program: { loaded_at: string } | null;
  };
}

export interface MasterRefreshResult {
  swapped: boolean;
  loaded_at: string;
  sources: {
    equipment: { loaded_at: string };
    db: { loaded_at: string };
  };
}

// ─── Paths ───────────────────────────────────────────────────────────────────

const MASTERS_DIR = path.resolve(__dirname, '../../../config/masters');
const SNAPSHOT_PATH = path.join(MASTERS_DIR, 'snapshot.json');
const PROGRAMS_PATH = path.join(MASTERS_DIR, 'programs.json');
const EQUIPMENT_STUB_PATH = path.join(MASTERS_DIR, 'equipment-stub.json');
const DB_STUB_PATH = path.join(MASTERS_DIR, 'db-stub.json');

// ─── In-process global cache ──────────────────────────────────────────────────

let _cache: MasterCache = {
  equipment: null,
  db: null,
  program: null,
  mode: 'cold',
  loaded_at: null,
};

/** Per-user cooldown map: userId → ISO timestamp of last refresh */
const _cooldownMap = new Map<string, string>();

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// ─── Loader stubs (replace with real MSSQL queries when schema is confirmed) ──

function loadEquipmentStub(): EquipmentCache {
  const raw = fs.readFileSync(EQUIPMENT_STUB_PATH, 'utf-8');
  return JSON.parse(raw) as EquipmentCache;
}

function loadDbStub(): DbCache {
  const raw = fs.readFileSync(DB_STUB_PATH, 'utf-8');
  return JSON.parse(raw) as DbCache;
}

function loadPrograms(): ProgramCache {
  const raw = fs.readFileSync(PROGRAMS_PATH, 'utf-8');
  const list = JSON.parse(raw) as string[];
  return { programs: list };
}

// ─── Boot initialisation ──────────────────────────────────────────────────────

/**
 * Called once at server boot. Attempts to load from live stubs; falls back to
 * snapshot file on failure; falls to cold-start if neither is available.
 * Never throws — boot must succeed regardless.
 */
export function initMasterCache(): void {
  try {
    const now = new Date().toISOString();

    const equipData = loadEquipmentStub();
    const dbData = loadDbStub();
    const progData = loadPrograms();

    _cache = {
      equipment: { data: equipData, loaded_at: now },
      db: { data: dbData, loaded_at: now },
      program: { data: progData, loaded_at: now },
      mode: 'live',
      loaded_at: now,
    };

    // Persist snapshot for future fallback
    _persistSnapshot(now);
    return;
  } catch {
    // Live load failed — try snapshot
  }

  try {
    _loadFromSnapshot();
    return;
  } catch {
    // Snapshot also missing/corrupt — cold-start
  }

  _cache = { equipment: null, db: null, program: null, mode: 'cold', loaded_at: null };
}

function _loadFromSnapshot(): void {
  const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
  const snap = JSON.parse(raw) as {
    equipment: EquipmentCache & { loaded_at: string };
    db: DbCache & { loaded_at: string };
    program: ProgramCache & { loaded_at: string };
    loaded_at: string;
  };

  _cache = {
    equipment: { data: snap.equipment, loaded_at: snap.equipment.loaded_at },
    db: { data: snap.db, loaded_at: snap.db.loaded_at },
    program: { data: snap.program, loaded_at: snap.program.loaded_at },
    mode: 'snapshot',
    loaded_at: snap.loaded_at,
  };
}

function _persistSnapshot(loadedAt: string): void {
  if (!_cache.equipment || !_cache.db || !_cache.program) return;
  const snap = {
    equipment: { ..._cache.equipment.data, loaded_at: _cache.equipment.loaded_at },
    db: { ..._cache.db.data, loaded_at: _cache.db.loaded_at },
    program: { ..._cache.program.data, loaded_at: _cache.program.loaded_at },
    mode: 'live',
    loaded_at: loadedAt,
  };
  try {
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snap, null, 2), 'utf-8');
  } catch {
    // snapshot write failure is non-fatal
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getMasterStatus(userId: string): MasterStatusResult {
  const cooldownEntry = _cooldownMap.get(userId);
  let cooldown_until: string | null = null;
  if (cooldownEntry) {
    const remaining = new Date(cooldownEntry).getTime() + COOLDOWN_MS - Date.now();
    if (remaining > 0) {
      cooldown_until = new Date(new Date(cooldownEntry).getTime() + COOLDOWN_MS).toISOString();
    }
  }

  return {
    loaded_at: _cache.loaded_at,
    cooldown_until,
    mode: _cache.mode,
    sources: {
      equipment: _cache.equipment
        ? { loaded_at: _cache.equipment.loaded_at, ...(_cache.equipment.kept_loaded_at ? { kept_loaded_at: _cache.equipment.kept_loaded_at } : {}) }
        : null,
      db: _cache.db
        ? { loaded_at: _cache.db.loaded_at, ...(_cache.db.kept_loaded_at ? { kept_loaded_at: _cache.db.kept_loaded_at } : {}) }
        : null,
      program: _cache.program
        ? { loaded_at: _cache.program.loaded_at }
        : null,
    },
  };
}

/**
 * Trigger a manual refresh of the two refreshable sources (equipment + db).
 * Cooldown: 5 min per user.
 * Atomic swap: all must succeed or existing cache is kept.
 *
 * Throws typed errors for route layer to map to HTTP status:
 *   { code: 'RATE_LIMITED', cooldown_until, kept_loaded_at }  → 429
 *   { code: 'EXTERNAL_MASTER_UNAVAILABLE', kept_loaded_at }   → 503
 */
export async function triggerRefresh(userId: string): Promise<MasterRefreshResult> {
  // Cooldown check
  const lastRefresh = _cooldownMap.get(userId);
  if (lastRefresh) {
    const elapsed = Date.now() - new Date(lastRefresh).getTime();
    if (elapsed < COOLDOWN_MS) {
      const cooldown_until = new Date(new Date(lastRefresh).getTime() + COOLDOWN_MS).toISOString();
      const kept_loaded_at = _cache.loaded_at;
      throw Object.assign(
        new Error('쿨다운 중입니다. 5분 후 다시 시도하세요.'),
        { code: 'RATE_LIMITED', cooldown_until, kept_loaded_at },
      );
    }
  }

  // Attempt atomic load of both refreshable sources
  const now = new Date().toISOString();
  let newEquip: EquipmentCache;
  let newDb: DbCache;

  try {
    newEquip = loadEquipmentStub();
    newDb = loadDbStub();
  } catch (err) {
    const kept_loaded_at = _cache.loaded_at;
    // Preserve existing kept_loaded_at on equipment/db if previously set
    if (_cache.equipment && kept_loaded_at) {
      _cache.equipment.kept_loaded_at = kept_loaded_at;
    }
    if (_cache.db && kept_loaded_at) {
      _cache.db.kept_loaded_at = kept_loaded_at;
    }
    throw Object.assign(
      new Error(`외부 마스터 로드 실패: ${String(err)}`),
      { code: 'EXTERNAL_MASTER_UNAVAILABLE', kept_loaded_at },
    );
  }

  // Both succeeded — atomically swap cache
  _cache.equipment = { data: newEquip, loaded_at: now };
  _cache.db = { data: newDb, loaded_at: now };
  _cache.loaded_at = now;
  _cache.mode = 'live';

  // Record cooldown for this user
  _cooldownMap.set(userId, now);

  // Persist new snapshot asynchronously (non-blocking, non-fatal)
  setImmediate(() => _persistSnapshot(now));

  return {
    swapped: true,
    loaded_at: now,
    sources: {
      equipment: { loaded_at: now },
      db: { loaded_at: now },
    },
  };
}

/** Expose raw cache data for downstream VOC field verification. */
export function getCacheData() {
  return {
    equipment: _cache.equipment?.data ?? null,
    db: _cache.db?.data ?? null,
    program: _cache.program?.data ?? null,
    mode: _cache.mode,
  };
}
