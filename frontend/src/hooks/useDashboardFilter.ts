import { useState, useMemo } from 'react';
import type { DashboardFilters } from '../api/dashboard';

export interface DashboardFilterState {
  globalTab: 'all' | string;
  activeMenu: string | null;
  assigneeId: string | null;
  dateRange: '7d' | '30d' | '90d';
}

function toStartDate(dateRange: '7d' | '30d' | '90d'): string {
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function useDashboardFilter() {
  const [filterState, setFilterState] = useState<DashboardFilterState>({
    globalTab: 'all',
    activeMenu: null,
    assigneeId: null,
    dateRange: '30d',
  });

  const apiFilters: DashboardFilters = useMemo(() => {
    return {
      systemId: filterState.globalTab !== 'all' ? filterState.globalTab : undefined,
      menuId: filterState.activeMenu ?? undefined,
      assigneeId: filterState.assigneeId ?? undefined,
      startDate: toStartDate(filterState.dateRange),
      endDate: new Date().toISOString().slice(0, 10),
    };
  }, [filterState]);

  function setGlobalTab(tab: string) {
    setFilterState((prev) => ({ ...prev, globalTab: tab, activeMenu: null }));
  }

  function setActiveMenu(menuId: string | null) {
    setFilterState((prev) => ({ ...prev, activeMenu: menuId }));
  }

  function setAssigneeId(assigneeId: string | null) {
    setFilterState((prev) => ({ ...prev, assigneeId }));
  }

  function setDateRange(dateRange: '7d' | '30d' | '90d') {
    setFilterState((prev) => ({ ...prev, dateRange }));
  }

  return {
    filterState,
    setGlobalTab,
    setActiveMenu,
    setAssigneeId,
    setDateRange,
    apiFilters,
  };
}
