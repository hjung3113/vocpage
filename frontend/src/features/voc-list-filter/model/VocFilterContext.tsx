import React, { createContext, useCallback, useMemo, useState } from 'react';

export type VocStatus = '접수' | '검토중' | '처리중' | '완료' | '드랍';

export interface VOCFilters {
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

export interface VOCFilterContextValue {
  filters: VOCFilters;
  setFilter: <K extends keyof VOCFilters>(key: K, value: VOCFilters[K]) => void;
  setFilters: (partial: Partial<VOCFilters>) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}

const DEFAULT_FILTERS: VOCFilters = {
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

export const VOCFilterContext = createContext<VOCFilterContextValue | null>(null);

export function VOCFilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<VOCFilters>(DEFAULT_FILTERS);

  const setFilter = useCallback(<K extends keyof VOCFilters>(key: K, value: VOCFilters[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setFilters = useCallback((partial: Partial<VOCFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const activeFilterCount = useMemo(() => {
    return (Object.keys(filters) as (keyof VOCFilters)[]).filter((key) => {
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

  return <VOCFilterContext.Provider value={value}>{children}</VOCFilterContext.Provider>;
}
