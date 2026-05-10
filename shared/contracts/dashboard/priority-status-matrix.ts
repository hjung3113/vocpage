/**
 * @module shared/contracts/dashboard/priority-status-matrix
 *
 * Contract for `GET /api/dashboard/priority-status-matrix`.
 * Spec: `docs/specs/requires/dashboard.md` §3 (우선순위 × 상태 매트릭스).
 *
 * The response is a 4 × 5 grid (priority rows × status cols). Intensity
 * shading is computed client-side from `max_value`. Color tokens per
 * spec §3 live in the widget, not here.
 */
import { z } from 'zod';
import { DashboardFilter } from './summary';

export const MatrixPriority = z.enum(['urgent', 'high', 'medium', 'low']);
export type MatrixPriority = z.infer<typeof MatrixPriority>;

export const MatrixStatus = z.enum(['접수', '검토중', '처리중', '완료', '드랍']);
export type MatrixStatus = z.infer<typeof MatrixStatus>;

/**
 * One row of the matrix (one priority level).
 * `cells` is keyed by MatrixStatus value, value = count (0 = empty cell).
 */
export const MatrixRow = z
  .object({
    priority: MatrixPriority,
    cells: z.record(MatrixStatus, z.number().int().nonnegative()),
    row_total: z.number().int().nonnegative(),
  })
  .strict();
export type MatrixRow = z.infer<typeof MatrixRow>;

export const PriorityStatusMatrixResponse = z
  .object({
    /** Statuses as ordered column headers (always all 5, left-to-right). */
    columns: z.array(MatrixStatus),
    rows: z.array(MatrixRow),
    /** Across all cells — used by the widget for intensity normalisation. */
    max_value: z.number().int().nonnegative(),
  })
  .strict();
export type PriorityStatusMatrixResponse = z.infer<typeof PriorityStatusMatrixResponse>;

/** Query params for GET /api/dashboard/priority-status-matrix. */
export const PriorityStatusMatrixFilter = DashboardFilter;
export type PriorityStatusMatrixFilter = z.infer<typeof PriorityStatusMatrixFilter>;
