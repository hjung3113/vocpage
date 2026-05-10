/**
 * Dashboard filter context — Wave 2 Phase B (dashboard.md §글로벌 필터).
 *
 * Holds the mutable filter that drives every widget query: system / menu /
 * assignee + date-range preset (custom uses startDate/endDate). Wrap the
 * dashboard tree in `<DashboardFilterProvider>`; consume via
 * `useDashboardFilter()`.
 *
 * Filter changes invalidate the summary query through TanStack Query's key
 * dependency (the filter object is part of the queryKey).
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { DashboardFilter } from '@contracts/dashboard';

interface DashboardFilterContextValue {
  filter: DashboardFilter;
  setFilter: (next: DashboardFilter) => void;
  patch: (delta: Partial<DashboardFilter>) => void;
  reset: () => void;
}

const DashboardFilterContext = createContext<DashboardFilterContextValue | null>(null);

export interface DashboardFilterProviderProps {
  initial?: DashboardFilter;
  children: ReactNode;
}

export function DashboardFilterProvider({ initial, children }: DashboardFilterProviderProps) {
  const [filter, setFilter] = useState<DashboardFilter>(initial ?? {});
  const value = useMemo<DashboardFilterContextValue>(
    () => ({
      filter,
      setFilter,
      patch: (delta) => setFilter((prev) => ({ ...prev, ...delta })),
      reset: () => setFilter(initial ?? {}),
    }),
    [filter, initial],
  );
  return (
    <DashboardFilterContext.Provider value={value}>{children}</DashboardFilterContext.Provider>
  );
}

export function useDashboardFilter(): DashboardFilterContextValue {
  const ctx = useContext(DashboardFilterContext);
  if (!ctx) {
    throw new Error('useDashboardFilter must be used within <DashboardFilterProvider>');
  }
  return ctx;
}
