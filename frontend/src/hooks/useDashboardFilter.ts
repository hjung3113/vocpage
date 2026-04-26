import { useState } from 'react';
import { DashboardQueryParams } from '../api/dashboard';

export interface DashboardFilterState {
  dateRange: { startDate: string; endDate: string };
  datePreset: '7d' | '30d' | '90d' | 'custom';
  globalTab: 'all' | string;
  activeMenu: string | null;
  activeAssignee: string | null;
}

export interface UseDashboardFilter {
  filter: DashboardFilterState;
  setDatePreset: (preset: '7d' | '30d' | '90d' | 'custom') => void;
  setDateRange: (startDate: string, endDate: string) => void;
  setGlobalTab: (tab: string) => void;
  setActiveMenu: (menuId: string | null) => void;
  setActiveAssignee: (assigneeId: string | null) => void;
  buildQueryParams: () => DashboardQueryParams;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function calcDateRange(preset: '7d' | '30d' | '90d'): { startDate: string; endDate: string } {
  const today = new Date();
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const start = new Date(today);
  start.setDate(today.getDate() - days);
  return { startDate: toISODate(start), endDate: toISODate(today) };
}

const initial30d = calcDateRange('30d');

const initialState: DashboardFilterState = {
  dateRange: initial30d,
  datePreset: '30d',
  globalTab: 'all',
  activeMenu: null,
  activeAssignee: null,
};

export function useDashboardFilter(): UseDashboardFilter {
  const [filter, setFilter] = useState<DashboardFilterState>(initialState);

  function setDatePreset(preset: '7d' | '30d' | '90d' | 'custom') {
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
