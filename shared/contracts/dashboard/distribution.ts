/**
 * @module shared/contracts/dashboard/distribution
 *
 * Contract for `GET /api/dashboard/distribution`.
 * Spec: `docs/specs/requires/dashboard.md` §2 (분포 탭 섹션).
 *
 * Returns an array of items representing the distribution of VOCs by the
 * requested `type` (status | priority | voc_type | tag). Tag tab returns
 * top 6 items + one "기타" aggregation row.
 *
 * Color mapping is NOT included — widgets apply token-driven colors per spec §2.
 * `dim` is accepted by the server but not returned in the response body.
 */
import { z } from 'zod';
import {
  DashboardFilterBase,
  requireDatesForCustomRange,
  requireDatesForCustomRangeError,
} from './summary';

export const DistributionType = z.enum(['status', 'priority', 'voc_type', 'tag']);
export type DistributionType = z.infer<typeof DistributionType>;

export const DistributionDim = z.enum(['all', 'system', 'menu']);
export type DistributionDim = z.infer<typeof DistributionDim>;

/** A single slice in the distribution donut. */
export const DistributionItem = z
  .object({
    /** Display label (e.g. "접수", "Urgent", tag name, "기타"). */
    label: z.string().min(1),
    /** Raw VOC count for this slice. */
    count: z.number().int().nonnegative(),
    /** Percentage of total (0–100, rounded to 1 decimal). */
    percentage: z.number().nonnegative(),
    /**
     * Opaque identifier used to build the VOC list navigation URL.
     * For tag slices this is the tag_id; for status/priority/voc_type it
     * mirrors the raw enum value ("접수", "urgent", voc_type code).
     * "기타" aggregate row uses the literal string "기타".
     */
    key: z.string().min(1),
  })
  .strict();
export type DistributionItem = z.infer<typeof DistributionItem>;

export const DistributionResponse = z
  .object({
    type: DistributionType,
    dim: DistributionDim,
    total: z.number().int().nonnegative(),
    items: z.array(DistributionItem),
  })
  .strict();
export type DistributionResponse = z.infer<typeof DistributionResponse>;

/** Query params for GET /api/dashboard/distribution (extends global filter). */
export const DistributionFilter = DashboardFilterBase.extend({
  type: DistributionType,
  dim: DistributionDim.optional(),
})
  .refine(requireDatesForCustomRange, requireDatesForCustomRangeError)
  .refine(
    (v) => !(v.dim === 'system' && v.systemId !== undefined),
    { message: 'dim=system is incompatible with systemId scope' },
  );
export type DistributionFilter = z.infer<typeof DistributionFilter>;
