/**
 * @module shared/contracts/dashboard/aging-vocs
 *
 * Contract for `GET /api/dashboard/aging-vocs?limit=10`.
 * Spec: `docs/specs/requires/dashboard.md` §9 (장기 미처리 VOC Top 10 v3).
 *
 * Returns the top-N long-pending (미완료) VOCs sorted by elapsed days DESC.
 * Date filter is accepted but silently ignored at the service layer — this
 * endpoint always reflects the current snapshot of unresolved VOCs regardless
 * of global date range (spec: "날짜 무관"). The BE must NOT return 400 when
 * startDate/endDate are present; they pass through the global filter envelope
 * but are not applied. (P1 resolution 2026-05-10: accept-but-ignore.)
 *
 * `elapsed_days` drives badge colour in the widget:
 *   14–29 days → amber badge, 30+ days → red badge (spec §9 table).
 *
 * `dim` controls whether `system_name` or `menu_name` is populated:
 *   dim=all    → system_name populated, menu_name null
 *   dim=system → menu_name populated (within the active system), system_name null
 */
import { z } from 'zod';
import { DashboardFilterBase } from './summary';

export const AgingVocDim = z.enum(['all', 'system']);
export type AgingVocDim = z.infer<typeof AgingVocDim>;

export const AgingVocItem = z
  .object({
    voc_id: z.string().uuid(),
    /** Formatted issue code — displayed with D2Coding font (spec §9). */
    issue_code: z.string().min(1),
    title: z.string().min(1),
    priority: z.enum(['urgent', 'high', 'medium', 'low']),
    /** Days since created_at (server-computed at query time). */
    elapsed_days: z.number().int().nonnegative(),
    /** Populated when dim=all. */
    system_name: z.string().nullable(),
    /** Populated when dim=system (within the active systemId). */
    menu_name: z.string().nullable(),
  })
  .strict();
export type AgingVocItem = z.infer<typeof AgingVocItem>;

export const AgingVocsResponse = z
  .object({
    dim: AgingVocDim,
    items: z.array(AgingVocItem),
  })
  .strict();
export type AgingVocsResponse = z.infer<typeof AgingVocsResponse>;

/** Query params for GET /api/dashboard/aging-vocs. */
export const AgingVocsFilter = DashboardFilterBase.extend({
  limit: z.coerce.number().int().positive().max(50).optional(),
  dim: AgingVocDim.optional(),
});
export type AgingVocsFilter = z.infer<typeof AgingVocsFilter>;
