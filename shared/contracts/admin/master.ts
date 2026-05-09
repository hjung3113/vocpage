/**
 * @module shared/contracts/admin/master
 *
 * External Masters admin contracts (Wave 3 Phase A · W3-3).
 *
 * Source-of-truth alignment:
 *  - Spec: requirements.md §16.3 + external-masters.md §0/§3/§4/§5/§6.
 *  - OpenAPI: shared/openapi.yaml — MasterStatus / MasterRefreshResult.
 *
 * Permission (ADR 0004 + OQ-2 Option B, 2026-05-09):
 *   - GET  /api/admin/masters/status     : Manager / Admin / Dev (read).
 *   - POST /api/admin/masters/refresh    : Manager+ (mutate).
 *
 * `program` master is loaded once at boot from `config/masters/programs.json`
 * (external-masters.md §5) — not refreshable, so it is *omitted* from the
 * `MasterRefreshResult.sources` map but *included* in `MasterStatus.sources`.
 */
import { z } from 'zod';

const Iso = z.string().datetime({ offset: true });

/** Refreshable master sources. `program` is excluded (boot-only — §5). */
export const RefreshableMasterSource = z.enum(['equipment', 'db']);
export type RefreshableMasterSource = z.infer<typeof RefreshableMasterSource>;

/** Status-eligible master sources (includes `program` boot-only). */
export const MasterSource = z.enum(['equipment', 'db', 'program']);
export type MasterSource = z.infer<typeof MasterSource>;

const SourceStatusEntry = z.object({
  loaded_at: Iso,
  /**
   * `kept_loaded_at` mirrors the prior loaded snapshot when an atomic-swap
   * refresh fails (`EXTERNAL_MASTER_UNAVAILABLE`, requirements.md §6.1).
   * Absent on programs (read-only) and on a fresh successful swap.
   */
  kept_loaded_at: Iso.optional(),
});
export type SourceStatusEntry = z.infer<typeof SourceStatusEntry>;

/**
 * `GET /api/admin/masters/status` response.
 * `cooldown_until` enforces 5-minute refresh throttle (requirements.md §6.1
 * `RATE_LIMITED`, external-masters.md §6).
 */
export const MasterStatus = z.object({
  loaded_at: Iso.nullable(),
  cooldown_until: Iso.nullable(),
  sources: z.object({
    equipment: SourceStatusEntry,
    db: SourceStatusEntry,
    program: SourceStatusEntry,
  }),
});
export type MasterStatus = z.infer<typeof MasterStatus>;

/**
 * `POST /api/admin/masters/refresh` response.
 * `program` is intentionally absent from `sources` (boot-only — see §5).
 */
export const MasterRefreshResult = z.object({
  swapped: z.boolean(),
  loaded_at: Iso,
  sources: z.object({
    equipment: z.object({ loaded_at: Iso }),
    db: z.object({ loaded_at: Iso }),
  }),
});
export type MasterRefreshResult = z.infer<typeof MasterRefreshResult>;
