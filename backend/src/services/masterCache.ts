import fs from 'fs';
import path from 'path';
import logger from '../logger';

// ── Types ────────────────────────────────────────────────────────────────────

export interface EquipmentCache {
  equipment: string[];
  maker: string[];
  model: string[];
  process: string[];
  loaded_at: string;
}

export interface DbCache {
  db_tables: string[];
  jobs: string[];
  sps: string[];
  loaded_at: string;
}

export interface ProgramCache {
  programs: string[];
  loaded_at: string;
}

export type MasterCacheMode = 'live' | 'snapshot' | 'cold_start';

export interface MasterState {
  equipment: EquipmentCache | null;
  db: DbCache | null;
  program: ProgramCache | null;
  mode: MasterCacheMode;
  loaded_at?: string;
}

export interface StructuredPayload {
  equipment?: string;
  maker?: string;
  model?: string;
  process?: string;
  related_db_tables?: string[];
  related_jobs?: string[];
  related_sps?: string[];
  related_programs?: string[];
  [key: string]: unknown;
}

// R7-6: pre-computed normalized Sets for O(1) membership checks in verifyPayload
interface VerifySets {
  equipment: Set<string>;
  maker: Set<string>;
  model: Set<string>;
  process: Set<string>;
  db_tables: Set<string>;
  jobs: Set<string>;
  sps: Set<string>;
  programs: Set<string>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const COOLDOWN_MS = 5 * 60 * 1000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// R7-6: build Sets once at cache-load time; reused on every verifyPayload call
function buildVerifySets(state: MasterState): VerifySets {
  const { equipment: eq, db, program: prog } = state;
  return {
    equipment: new Set((eq?.equipment ?? []).map(normalize)),
    maker: new Set((eq?.maker ?? []).map(normalize)),
    model: new Set((eq?.model ?? []).map(normalize)),
    process: new Set((eq?.process ?? []).map(normalize)),
    db_tables: new Set((db?.db_tables ?? []).map(normalize)),
    jobs: new Set((db?.jobs ?? []).map(normalize)),
    sps: new Set((db?.sps ?? []).map(normalize)),
    programs: new Set((prog?.programs ?? []).map(normalize)),
  };
}

// ── Stub loaders ──────────────────────────────────────────────────────────────

// R7-3: async I/O — no blocking reads on the event loop
async function loadFromStub(
  configDir: string,
): Promise<{ equipment: EquipmentCache; program: ProgramCache }> {
  const eqPath = path.join(configDir, 'equipment-stub.json');
  const progPath = path.join(configDir, 'programs.json');

  const [eqRaw, progRaw] = await Promise.all([
    fs.promises.readFile(eqPath, 'utf8'),
    fs.promises.readFile(progPath, 'utf8'),
  ]);

  const eq = JSON.parse(eqRaw) as {
    equipment: string[];
    maker: string[];
    model: string[];
    process: string[];
  };
  const progList = JSON.parse(progRaw) as string[];

  const now = new Date().toISOString();
  return {
    equipment: { ...eq, loaded_at: now },
    program: { programs: progList, loaded_at: now },
  };
}

async function loadDbStub(): Promise<DbCache> {
  return {
    db_tables: ['users', 'vocs', 'comments'],
    jobs: ['nightly_backup', 'weekly_report'],
    sps: ['sp_get_voc', 'sp_update_status'],
    loaded_at: new Date().toISOString(),
  };
}

// ── MasterCacheService ────────────────────────────────────────────────────────

class MasterCacheService {
  private state: MasterState = {
    equipment: null,
    db: null,
    program: null,
    mode: 'cold_start',
  };

  // R7-6: pre-computed sets, rebuilt on every state swap
  private verifySets: VerifySets = buildVerifySets(this.state);

  private lastRefreshByUser: Record<string, number> = {};
  private configDir: string;

  constructor(configDir?: string) {
    this.configDir = configDir ?? path.resolve(__dirname, '../../config/masters');
  }

  async init(configDir?: string): Promise<void> {
    if (configDir) this.configDir = configDir;

    try {
      const { equipment, program } = await loadFromStub(this.configDir);
      const db = await loadDbStub();
      const now = new Date().toISOString();
      this.state = { equipment, db, program, mode: 'live', loaded_at: now };
      this.verifySets = buildVerifySets(this.state); // R7-6
      this.writeSnapshot().catch((err) =>
        logger.warn({ err }, 'masterCache: writeSnapshot failed (non-fatal)'),
      );
      return;
    } catch (err) {
      // R7-4: structured logging
      logger.warn({ err }, 'masterCache: stub load failed, trying snapshot');
    }

    try {
      const snap = await this.readSnapshot(); // R7-3: async
      this.state = { ...snap, mode: 'snapshot' };
      this.verifySets = buildVerifySets(this.state); // R7-6
      return;
    } catch (err) {
      // R7-4: structured logging
      logger.warn({ err }, 'masterCache: snapshot load failed, falling back to cold_start');
    }

    if (this.state.mode === 'cold_start') {
      this.state = { equipment: null, db: null, program: null, mode: 'cold_start' };
      this.verifySets = buildVerifySets(this.state); // R7-6
    }
  }

  get(): MasterState {
    return this.state;
  }

  async refresh(userId: string): Promise<
    | {
        swapped: true;
        loaded_at: string;
        sources: { equipment: { loaded_at: string }; db: { loaded_at: string } };
      }
    | { swapped: false; error: string; kept_loaded_at: string | undefined }
  > {
    const gcBefore = Date.now() - COOLDOWN_MS * 2;
    for (const [uid, ts] of Object.entries(this.lastRefreshByUser)) {
      if (ts < gcBefore) delete this.lastRefreshByUser[uid];
    }

    const now = Date.now();
    const last = this.lastRefreshByUser[userId] ?? 0;
    const elapsed = now - last;

    if (elapsed < COOLDOWN_MS) {
      const retryAfter = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      throw { code: 'RATE_LIMITED', retryAfter };
    }

    try {
      const { equipment, program } = await loadFromStub(this.configDir);
      const db = await loadDbStub();
      const loaded_at = new Date().toISOString();

      this.state = { equipment, db, program, mode: 'live', loaded_at };
      this.verifySets = buildVerifySets(this.state); // R7-6
      this.lastRefreshByUser[userId] = now;

      this.writeSnapshot().catch((err) =>
        logger.warn({ err }, 'masterCache: writeSnapshot failed (non-fatal)'),
      );

      return {
        swapped: true,
        loaded_at,
        sources: {
          equipment: { loaded_at: equipment.loaded_at },
          db: { loaded_at: db.loaded_at },
        },
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      return {
        swapped: false,
        error,
        kept_loaded_at: this.state.loaded_at,
      };
    }
  }

  // R7-6: O(1) Set lookups instead of O(n) .map(normalize).includes() per call
  verifyPayload(payload: StructuredPayload): string[] {
    const unverified: string[] = [];
    const { equipment: eq, db, program: prog } = this.state;
    const sets = this.verifySets;

    if (!eq) {
      if (payload.equipment) unverified.push('equipment');
      if (payload.maker) unverified.push('maker');
      if (payload.model) unverified.push('model');
      if (payload.process) unverified.push('process');
    } else {
      if (payload.equipment && !sets.equipment.has(normalize(payload.equipment)))
        unverified.push('equipment');
      if (payload.maker && !sets.maker.has(normalize(payload.maker))) unverified.push('maker');
      if (payload.model && !sets.model.has(normalize(payload.model))) unverified.push('model');
      if (payload.process && !sets.process.has(normalize(payload.process)))
        unverified.push('process');
    }

    const relDbTables = payload.related_db_tables;
    const relJobs = payload.related_jobs;
    const relSps = payload.related_sps;
    if (!db) {
      if (relDbTables?.length) unverified.push('related_db_tables');
      if (relJobs?.length) unverified.push('related_jobs');
      if (relSps?.length) unverified.push('related_sps');
    } else {
      if (relDbTables?.some((v) => !sets.db_tables.has(normalize(v))))
        unverified.push('related_db_tables');
      if (relJobs?.some((v) => !sets.jobs.has(normalize(v)))) unverified.push('related_jobs');
      if (relSps?.some((v) => !sets.sps.has(normalize(v)))) unverified.push('related_sps');
    }

    const relProgs = payload.related_programs;
    if (!prog) {
      if (relProgs?.length) unverified.push('related_programs');
    } else {
      if (relProgs?.some((v) => !sets.programs.has(normalize(v))))
        unverified.push('related_programs');
    }

    return [...new Set(unverified)];
  }

  search(type: string, q: string): string[] {
    const { equipment: eq, db, program: prog } = this.state;
    const qNorm = normalize(q);

    let pool: string[] = [];

    switch (type) {
      case 'equipment':
        pool = eq?.equipment ?? [];
        break;
      case 'maker':
        pool = eq?.maker ?? [];
        break;
      case 'model':
        pool = eq?.model ?? [];
        break;
      case 'process':
        pool = eq?.process ?? [];
        break;
      case 'db_tables':
        pool = db?.db_tables ?? [];
        break;
      case 'jobs':
        pool = db?.jobs ?? [];
        break;
      case 'sps':
        pool = db?.sps ?? [];
        break;
      case 'programs':
        pool = prog?.programs ?? [];
        break;
      default:
        return [];
    }

    return pool.filter((item) => normalize(item).startsWith(qNorm)).slice(0, 20);
  }

  // ── Snapshot helpers ─────────────────────────────────────────────────────

  private async writeSnapshot(): Promise<void> {
    const snapshotPath = path.join(this.configDir, 'snapshot.json');
    const tmpPath = `${snapshotPath}.tmp`;
    const data = JSON.stringify(this.state, null, 2);
    await fs.promises.writeFile(tmpPath, data, 'utf8');
    await fs.promises.rename(tmpPath, snapshotPath);
  }

  // R7-3: async readFile instead of blocking readFileSync
  private async readSnapshot(): Promise<MasterState> {
    const snapshotPath = path.join(this.configDir, 'snapshot.json');
    const raw = await fs.promises.readFile(snapshotPath, 'utf8');
    return JSON.parse(raw) as MasterState;
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

let _instance: MasterCacheService | null = null;

function getInstance(): MasterCacheService {
  if (!_instance) {
    _instance = new MasterCacheService();
  }
  return _instance;
}

/** Reset singleton — TEST USE ONLY */
export function reset(): void {
  _instance = null;
}

export const masterCache = {
  init(configDir?: string): Promise<void> {
    return getInstance().init(configDir);
  },
  get(): MasterState {
    return getInstance().get();
  },
  refresh(userId: string): ReturnType<MasterCacheService['refresh']> {
    return getInstance().refresh(userId);
  },
  verifyPayload(payload: StructuredPayload): string[] {
    return getInstance().verifyPayload(payload);
  },
  search(type: string, q: string): string[] {
    return getInstance().search(type, q);
  },
};
