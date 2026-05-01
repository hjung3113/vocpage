/**
 * selectors.ts — mapping table from §5 of the design doc.
 * Returns structural fallback selectors for Stage 1 (before data-pcomp markers land in Stage 2).
 */

export type ComponentId =
  | 'voc-topbar'
  | 'voc-status-filters'
  | 'voc-advanced-filters'
  | 'voc-sort-chips'
  | 'voc-table'
  | 'voc-pagination'
  | 'voc-create-modal'
  | 'voc-notif-dropdown'
  | 'voc-review-drawer'
  | 'notification-bell'
  | 'pagination'
  | 'data-table';

export interface SelectorEntry {
  componentId: ComponentId;
  proto: string;
  react: string;
  /** True when we're using the data-pcomp marker (Stage 2+); false = structural fallback */
  hasPcompMarker: boolean;
}

/**
 * Mapping table: componentId → prototype selector + React selector.
 * Stage 1: all entries use structural fallback selectors.
 * Stage 2: hasPcompMarker becomes true and selectors become [data-pcomp="<id>"].
 */
export const SELECTOR_MAP: readonly SelectorEntry[] = [
  {
    componentId: 'voc-topbar',
    proto: '#page-voc > .topbar',
    react: '[data-pcomp="voc-topbar"]',
    hasPcompMarker: false,
  },
  {
    componentId: 'voc-status-filters',
    proto: '#page-voc > .filterbar',
    react: '[data-pcomp="voc-status-filters"]',
    hasPcompMarker: false,
  },
  {
    componentId: 'voc-advanced-filters',
    proto: '#advFilterWrap',
    react: '[data-pcomp="voc-advanced-filters"]',
    hasPcompMarker: false,
  },
  {
    componentId: 'voc-sort-chips',
    proto: '.list-toolbar',
    react: '[data-pcomp="voc-sort-chips"]',
    hasPcompMarker: false,
  },
  {
    componentId: 'voc-table',
    proto: '.list-area',
    react: '[data-pcomp="voc-table"]',
    hasPcompMarker: false,
  },
  {
    componentId: 'voc-pagination',
    proto: '#paginationRow',
    react: '[data-pcomp="voc-pagination"]',
    hasPcompMarker: false,
  },
  {
    componentId: 'voc-create-modal',
    proto: '[data-pcomp="voc-create-modal"]',
    react: '[data-pcomp="voc-create-modal"]',
    hasPcompMarker: false,
  },
  {
    componentId: 'voc-notif-dropdown',
    proto: '[data-pcomp="voc-notif-dropdown"]',
    react: '[data-pcomp="voc-notif-dropdown"]',
    hasPcompMarker: false,
  },
  {
    componentId: 'voc-review-drawer',
    proto: '[data-pcomp="voc-review-drawer"]',
    react: '[data-pcomp="voc-review-drawer"]',
    hasPcompMarker: false,
  },
  {
    componentId: 'notification-bell',
    proto: '#notifBtn',
    react: '[data-pcomp="notification-bell"]',
    hasPcompMarker: false,
  },
  {
    componentId: 'pagination',
    proto: '#paginationRow .pagination',
    react: '[data-pcomp="pagination"]',
    hasPcompMarker: false,
  },
  {
    componentId: 'data-table',
    proto: '.list-header',
    react: '[data-pcomp="data-table"]',
    hasPcompMarker: false,
  },
] as const;

/**
 * getSelectorChain — returns the CSS selector string for a given componentId and side.
 * In Stage 1 all selectors are structural fallbacks.
 */
export function getSelectorChain(componentId: ComponentId, side: 'proto' | 'react'): string {
  const entry = SELECTOR_MAP.find((e) => e.componentId === componentId);
  if (!entry) {
    throw new Error(`Unknown componentId: ${componentId}`);
  }
  return side === 'proto' ? entry.proto : entry.react;
}

/** Returns all entries that use structural fallback (i.e. not yet Stage 2 marked). */
export function getFallbackComponents(): ComponentId[] {
  return SELECTOR_MAP.filter((e) => !e.hasPcompMarker).map((e) => e.componentId);
}
