/**
 * buildVocUrl — Wave 2 Phase C review fix (P0-2).
 * Builds /voc navigation URLs preserving globalFilter context.
 * Used by dashboard widgets for click-through navigation.
 */
import type { DashboardFilter } from '@contracts/dashboard';

/** Keys from DashboardFilter that map 1:1 to /voc search params. */
const GLOBAL_FILTER_KEYS: (keyof DashboardFilter)[] = [
  'systemId',
  'menuId',
  'assigneeId',
  'startDate',
  'endDate',
];

/**
 * Build a /voc URL with the given widget-specific params merged with
 * the current dashboard globalFilter. undefined values are omitted.
 */
export function buildVocUrl(
  widgetParams: Record<string, string | undefined>,
  globalFilter: DashboardFilter,
): string {
  const params = new URLSearchParams();

  // Widget-specific params first (they may override global)
  for (const [key, val] of Object.entries(widgetParams)) {
    if (val !== undefined && val !== '') {
      params.set(key, val);
    }
  }

  // Preserve global filter — do NOT override if widget already set the key
  for (const key of GLOBAL_FILTER_KEYS) {
    const val = globalFilter[key];
    if (val !== undefined && val !== '' && !params.has(key)) {
      params.set(key, String(val));
    }
  }

  const qs = params.toString();
  return qs ? `/voc?${qs}` : '/voc';
}
