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
  | 'voc-review-sections'
  | 'notification-bell'
  | 'pagination'
  | 'data-table'
  | 'voc-priority-badge';

export interface SelectorEntry {
  componentId: ComponentId;
  proto: string;
  react: string;
  /** True when the component requires programmatic open (modal/dropdown/drawer) before extraction */
  isOverlay: boolean;
}

/**
 * Mapping table: componentId → prototype selector + React selector.
 * Stage 1: all entries use structural fallback selectors.
 * Stage 2: isOverlay becomes true and selectors become [data-pcomp="<id>"].
 */
export const SELECTOR_MAP: readonly SelectorEntry[] = [
  {
    componentId: 'voc-topbar',
    proto: '#page-voc > .topbar',
    react: '[data-pcomp="voc-topbar"]',
    isOverlay: false,
  },
  {
    componentId: 'voc-status-filters',
    proto: '#page-voc > .filterbar',
    react: '[data-pcomp="voc-status-filters"]',
    isOverlay: false,
  },
  {
    componentId: 'voc-advanced-filters',
    proto: '#advFilterWrap',
    react: '[data-pcomp="voc-advanced-filters"]',
    isOverlay: false,
  },
  {
    componentId: 'voc-sort-chips',
    proto: '.list-toolbar',
    react: '[data-pcomp="voc-sort-chips"]',
    isOverlay: false,
  },
  {
    componentId: 'voc-table',
    proto: '.list-area',
    react: '[data-pcomp="voc-table"]',
    isOverlay: false,
  },
  {
    componentId: 'voc-pagination',
    proto: '#paginationRow',
    react: '[data-pcomp="voc-pagination"]',
    isOverlay: false,
  },
  {
    componentId: 'voc-create-modal',
    // openModal() makes #modalBg visible; .modal inside is the actual dialog panel
    proto: '#modalBg .modal',
    react: '[data-pcomp="voc-create-modal"]',
    isOverlay: true,
  },
  {
    componentId: 'voc-notif-dropdown',
    // toggleNotif() shows #notifPanel; use it as the structural root
    proto: '#notifPanel',
    react: '[data-pcomp="voc-notif-dropdown"]',
    isOverlay: true,
  },
  {
    componentId: 'voc-review-drawer',
    // openDrawer() shows #drawer; use it as the structural root
    proto: '#drawer',
    react: '[data-pcomp="voc-review-drawer"]',
    isOverlay: true,
  },
  {
    componentId: 'voc-review-sections',
    // Wave 1.6 C-13: prototype has no tab UI — flat .d-section siblings.
    // Structural root: #drawerBody (the section column inside the drawer).
    proto: '#drawerBody',
    react: '[data-pcomp="voc-review-sections"]',
    isOverlay: true,
  },
  {
    componentId: 'notification-bell',
    proto: '#notifBtn',
    react: '[data-pcomp="notification-bell"]',
    isOverlay: false,
  },
  {
    componentId: 'pagination',
    proto: '#paginationRow .pagination',
    react: '[data-pcomp="pagination"]',
    isOverlay: false,
  },
  {
    componentId: 'data-table',
    proto: '.list-header',
    react: 'thead[data-pcomp="data-table"]',
    isOverlay: false,
  },
  {
    componentId: 'voc-priority-badge',
    proto:
      '.list-area .pri-badge.p-urgent, .list-area .pri-badge.p-high, .list-area .pri-badge.p-medium, .list-area .pri-badge.p-low',
    react: '[data-testid^="priority-badge-"]',
    isOverlay: false,
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

/** Returns all non-overlay component ids (i.e. those that do not require programmatic open). */
export function getFallbackBannerComponents(): ComponentId[] {
  return SELECTOR_MAP.filter((e) => !e.isOverlay).map((e) => e.componentId);
}
