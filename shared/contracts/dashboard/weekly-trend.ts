/**
 * @module shared/contracts/dashboard/weekly-trend
 *
 * Contract for `GET /api/dashboard/weekly-trend`.
 * Spec: `docs/specs/requires/dashboard.md` §5 (주간 트렌드 v3 변경: 3선).
 *
 * Fixed 12-week window — startDate/endDate from the global filter are ignored
 * by this endpoint (spec: "기간: 최근 12주 고정 (커스텀 날짜 필터와 무관)").
 * systemId/menuId/assigneeId are still applied.
 *
 * Three series — each with a different computation basis (see spec §5 table):
 *   new              — created_at in week
 *   enteredInProgress — VOCs whose status_changed_at falls in this week AND
 *                       whose new status is 검토중 or 처리중. NOT a snapshot of
 *                       in-progress count at week end (no status_history table).
 *                       Spec deviation v3.1 (2026-05-10): original spec said
 *                       "주말 스냅샷 기준"; corrected to "진입 카운트" due to
 *                       absence of status_history table.
 *   done              — status_changed_at to 완료|드랍 in week
 *
 * `weekStarts` provides ISO date strings (Monday) for each week so the widget
 * can build VOC list navigation URLs without computing them client-side.
 */
import { z } from 'zod';
import { DashboardFilter } from './summary';

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const WeeklyTrendResponse = z
  .object({
    /** X-axis labels, length 12. W1 = oldest, W12 = current week. */
    weeks: z.array(z.string().min(1)).length(12),
    /**
     * ISO-8601 Monday date for each week (same order as `weeks`).
     * Used by the widget for click-through URL construction.
     */
    weekStarts: z.array(IsoDate).length(12),
    series: z
      .object({
        /** VOCs created (created_at) in each week. */
        new: z.array(z.number().int().nonnegative()).length(12),
        /**
         * VOCs whose status_changed_at falls in this week and whose new status
         * is 검토중 or 처리중. NOT a snapshot at week-end Sunday 23:59 (that
         * requires a status_history table which does not exist). This is a
         * transition count into in-progress states within the week.
         * Spec deviation v3.1 (2026-05-10).
         */
        enteredInProgress: z.array(z.number().int().nonnegative()).length(12),
        /** VOCs transitioned to 완료|드랍 (status_changed_at) in each week. */
        done: z.array(z.number().int().nonnegative()).length(12),
      })
      .strict(),
  })
  .strict();
export type WeeklyTrendResponse = z.infer<typeof WeeklyTrendResponse>;

/**
 * Query params for GET /api/dashboard/weekly-trend.
 * `weeks` is fixed at 12 — param accepted but ignored (always 12).
 * `startDate` / `endDate` are accepted but ignored per spec.
 */
export const WeeklyTrendFilter = DashboardFilter.extend({
  weeks: z.coerce.number().int().positive().optional(),
});
export type WeeklyTrendFilter = z.infer<typeof WeeklyTrendFilter>;
