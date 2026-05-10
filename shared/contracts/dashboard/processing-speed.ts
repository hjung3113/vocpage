/**
 * @module shared/contracts/dashboard/processing-speed
 *
 * Contract for `GET /api/dashboard/processing-speed`.
 * Spec: `docs/specs/requires/dashboard.md` §10 (처리속도 — SLA 준수율).
 *
 * Returns one row per dimension unit (system or menu depending on dim/globalTab).
 * SLA compliance color thresholds (≥80% green / 60–79% amber / <60% red) are
 * applied in the widget per spec §10 tokens — not encoded here.
 *
 * `sla_rate` is a value in [0, 100] (percent). Null when the unit has no
 * completed VOCs in the window (cannot compute average or SLA).
 */
import { z } from 'zod';
import { DashboardFilter } from './summary';

export const ProcessingSpeedDim = z.enum(['all', 'system', 'menu']);
export type ProcessingSpeedDim = z.infer<typeof ProcessingSpeedDim>;

export const ProcessingSpeedRow = z
  .object({
    /** UUID of the system or menu. Null for the "전체" aggregate row. */
    id: z.string().uuid().nullable(),
    /** Display label (system name, menu name, or "전체"). */
    name: z.string().min(1),
    /**
     * Average processing days (decimal, 1dp) for completed VOCs in the window.
     * Null when no completed VOCs exist.
     */
    avg_days: z.number().nullable(),
    /**
     * Percentage of completed VOCs finished within their due_date.
     * Null when slaEligibleCount === 0 (no completed VOCs with a non-null
     * due_date exist in the window — cannot compute a meaningful rate).
     * Use `status_changed_at WHERE status='완료'` + `due_date` for this check;
     * there is NO `completed_at` column.
     */
    sla_rate: z.number().min(0).max(100).nullable(),
    /** Total completed VOC count used to derive the averages. */
    completed_count: z.number().int().nonnegative(),
    /**
     * Completed VOCs with a non-null due_date — the denominator for sla_rate.
     * When 0, sla_rate is null.
     */
    slaEligibleCount: z.number().int().nonnegative(),
    /**
     * Completed VOCs with a null due_date — excluded from SLA computation.
     * Surfaced so the widget can display a "N VOCs have no due_date" footnote.
     */
    missingDueDateCount: z.number().int().nonnegative(),
  })
  .strict();
export type ProcessingSpeedRow = z.infer<typeof ProcessingSpeedRow>;

export const ProcessingSpeedResponse = z
  .object({
    dim: ProcessingSpeedDim,
    rows: z.array(ProcessingSpeedRow),
  })
  .strict();
export type ProcessingSpeedResponse = z.infer<typeof ProcessingSpeedResponse>;

/** Query params for GET /api/dashboard/processing-speed. */
export const ProcessingSpeedFilter = DashboardFilter.extend({
  dim: ProcessingSpeedDim.optional(),
}).refine(
  (v) => !(v.dim === 'system' && v.systemId !== undefined),
  { message: 'dim=system is incompatible with systemId scope' },
);
export type ProcessingSpeedFilter = z.infer<typeof ProcessingSpeedFilter>;
