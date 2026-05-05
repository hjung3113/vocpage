import React, { createContext, useCallback, useMemo, useState } from 'react';

export type VocStatus = '접수' | '검토중' | '처리중' | '완료' | '드랍';

export interface VocFilters {
  systemId: string | null;
  menuId: string | null;
  status: VocStatus[];
  tagIds: string[];
  assigneeId: string | null;
  from: string | null;
  to: string | null;
  keyword: string;
  source: 'manual' | 'import' | null;
}

export interface VocFilterContextValue {
  filters: VocFilters;
  setFilter: <K extends keyof VocFilters>(key: K, value: VocFilters[K]) => void;
  setFilters: (partial: Partial<VocFilters>) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

const DEFAULT_FILTERS: VocFilters = {
  systemId: null,
  menuId: null,
  status: [],
  tagIds: [],
  assigneeId: null,
  from: null,
  to: null,
  keyword: '',
  source: null,
};

export const VocFilterContext = createContext<VocFilterContextValue | null>(null);

export function VocFilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<VocFilters>(DEFAULT_FILTERS);

  const setFilter = useCallback(<K extends keyof VocFilters>(key: K, value: VocFilters[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFilters = useCallback((partial: Partial<VocFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const activeFilterCount = useMemo(() => {
    return (Object.keys(filters) as (keyof VocFilters)[]).filter((key) => {
      const val = filters[key];
      if (val === null) return false;
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === 'string') return val.trim().length > 0;
      return true;
    }).length;
  }, [filters]);

  const value = useMemo(
    () => ({ filters, setFilter, setFilters, resetFilters, activeFilterCount }),
    [filters, setFilter, setFilters, resetFilters, activeFilterCount],
  );

  return <VocFilterContext.Provider value={value}>{children}</VocFilterContext.Provider>;
}
