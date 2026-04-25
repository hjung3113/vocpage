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

// Payload shape used for verifyPayload
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

// ── Constants ─────────────────────────────────────────────────────────────────

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

// ── Stub loaders ──────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

async function loadFromStub(
  configDir: string,
): Promise<{ equipment: EquipmentCache; program: ProgramCache }> {
  const eqPath = path.join(configDir, 'equipment-stub.json');
  const progPath = path.join(configDir, 'programs.json');

  const eqRaw = fs.readFileSync(eqPath, 'utf8');
  const progRaw = fs.readFileSync(progPath, 'utf8');

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
      this.writeSnapshot().catch((err) =>
        logger.warn({ err }, 'masterCache: writeSnapshot failed (non-fatal)'),
      );
      return;
    } catch (err) {
      console.warn('[masterCache] stub load failed, trying snapshot:', err);
    }

    try {
      const snap = this.readSnapshot();
      this.state = { ...snap, mode: 'snapshot' };
      return;
    } catch (err) {
      console.warn('[masterCache] snapshot load failed, falling back to cold_start:', err);
    }

    // Only set cold_start if not already in a valid live/snapshot state
    if (this.state.mode === 'cold_start') {
      this.state = { equipment: null, db: null, program: null, mode: 'cold_start' };
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
    // GC expired cooldown entries
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

  verifyPayload(payload: StructuredPayload): string[] {
    const unverified: string[] = [];
    const { equipment: eq, db, program: prog } = this.state;

    // Equipment master fields
    if (!eq) {
      if (payload.equipment) unverified.push('equipment');
      if (payload.maker) unverified.push('maker');
      if (payload.model) unverified.push('model');
      if (payload.process) unverified.push('process');
    } else {
      if (payload.equipment && !eq.equipment.map(normalize).includes(normalize(payload.equipment)))
        unverified.push('equipment');
      if (payload.maker && !eq.maker.map(normalize).includes(normalize(payload.maker)))
        unverified.push('maker');
      if (payload.model && !eq.model.map(normalize).includes(normalize(payload.model)))
        unverified.push('model');
      if (payload.process && !eq.process.map(normalize).includes(normalize(payload.process)))
        unverified.push('process');
    }

    // DB master fields
    const relDbTables = payload.related_db_tables;
    const relJobs = payload.related_jobs;
    const relSps = payload.related_sps;
    if (!db) {
      if (relDbTables?.length) unverified.push('related_db_tables');
      if (relJobs?.length) unverified.push('related_jobs');
      if (relSps?.length) unverified.push('related_sps');
    } else {
      if (relDbTables?.some((v) => !db.db_tables.map(normalize).includes(normalize(v))))
        unverified.push('related_db_tables');
      if (relJobs?.some((v) => !db.jobs.map(normalize).includes(normalize(v))))
        unverified.push('related_jobs');
      if (relSps?.some((v) => !db.sps.map(normalize).includes(normalize(v))))
        unverified.push('related_sps');
    }

    // Program master fields
    const relProgs = payload.related_programs;
    if (!prog) {
      if (relProgs?.length) unverified.push('related_programs');
    } else {
      if (relProgs?.some((v) => !prog.programs.map(normalize).includes(normalize(v))))
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

  private readSnapshot(): MasterState {
    const snapshotPath = path.join(this.configDir, 'snapshot.json');
    const raw = fs.readFileSync(snapshotPath, 'utf8');
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
