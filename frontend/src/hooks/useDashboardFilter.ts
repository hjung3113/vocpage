import { useState } from 'react';
import { DashboardQueryParams } from '../api/dashboard';

export interface DashboardFilterState {
  dateRange: { startDate: string; endDate: string };
  datePreset: '1m' | '3m' | '1y' | 'all' | 'custom';
  globalTab: 'all' | string;
  activeMenu: string | null;
  activeAssignee: string | null;
}

export interface UseDashboardFilter {
  filter: DashboardFilterState;
  setDatePreset: (preset: '1m' | '3m' | '1y' | 'all' | 'custom') => void;
  setDateRange: (startDate: string, endDate: string) => void;
  setGlobalTab: (tab: string) => void;
  setActiveMenu: (menuId: string | null) => void;
  setActiveAssignee: (assigneeId: string | null) => void;
  buildQueryParams: () => DashboardQueryParams;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calcDateRange(preset: '1m' | '3m' | '1y' | 'all'): { startDate: string; endDate: string } {
  const today = new Date();
  const end = toISODate(today);
  if (preset === 'all') return { startDate: '2020-01-01', endDate: end };
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (preset === '1m') start.setMonth(start.getMonth() - 1);
  else if (preset === '3m') start.setMonth(start.getMonth() - 3);
  else if (preset === '1y') start.setFullYear(start.getFullYear() - 1);
  return { startDate: toISODate(start), endDate: end };
}

const initial1m = calcDateRange('1m');

const initialState: DashboardFilterState = {
  dateRange: initial1m,
  datePreset: '1m',
  globalTab: 'all',
  activeMenu: null,
  activeAssignee: null,
};

export function useDashboardFilter(): UseDashboardFilter {
  const [filter, setFilter] = useState<DashboardFilterState>(initialState);

  function setDatePreset(preset: '1m' | '3m' | '1y' | 'all' | 'custom') {
    setFilter((prev) => {
      const dateRange = preset === 'custom' ? prev.dateRange : calcDateRange(preset);
      return { ...prev, datePreset: preset, dateRange };
    });
  }

  function setDateRange(startDate: string, endDate: string) {
    setFilter((prev) => ({
      ...prev,
      dateRange: { startDate, endDate },
      datePreset: 'custom',
    }));
  }

  function setGlobalTab(tab: string) {
    setFilter((prev) => ({ ...prev, globalTab: tab, activeMenu: null }));
  }

  function setActiveMenu(menuId: string | null) {
    setFilter((prev) => ({ ...prev, activeMenu: menuId }));
  }

  function setActiveAssignee(assigneeId: string | null) {
    setFilter((prev) => ({ ...prev, activeAssignee: assigneeId }));
  }

  function buildQueryParams(): DashboardQueryParams {
    const params: DashboardQueryParams = {
      startDate: filter.dateRange.startDate,
      endDate: filter.dateRange.endDate,
    };
    if (filter.globalTab !== 'all') params.systemId = filter.globalTab;
    if (filter.activeMenu !== null) params.menuId = filter.activeMenu;
    if (filter.activeAssignee !== null) params.assigneeId = filter.activeAssignee;
    return params;
  }

  return {
    filter,
    setDatePreset,
    setDateRange,
    setGlobalTab,
    setActiveMenu,
    setActiveAssignee,
    buildQueryParams,
  };
}
