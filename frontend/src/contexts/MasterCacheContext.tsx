import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useContext } from 'react';
import {
  getMasterStatus,
  searchMaster,
  triggerAdminRefresh,
  triggerVocRefresh,
} from '../api/masters';
import { AuthContext } from './AuthContext';

export interface MasterCacheContextValue {
  mode: 'live' | 'snapshot' | 'cold_start' | 'unknown';
  isSnapshotMode: boolean;
  isColdStartMode: boolean;
  triggerRefresh: (vocId?: string) => Promise<void>;
  search: (type: string, q: string) => Promise<string[]>;
}

export const MasterCacheContext = createContext<MasterCacheContextValue | null>(null);

export function MasterCacheProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<MasterCacheContextValue['mode']>('unknown');
  const auth = useContext(AuthContext);

  useEffect(() => {
    const user = auth?.user;
    if (!user || user.role === 'user') return;
    getMasterStatus()
      .then((status) => setMode(status.mode))
      .catch(() => {
        // silently leave mode as 'unknown' on fetch failure
      });
  }, [auth?.user]);

  const triggerRefresh = useCallback(async (vocId?: string) => {
    const result = vocId ? await triggerVocRefresh(vocId) : await triggerAdminRefresh();
    try {
      const status = await getMasterStatus();
      setMode(status.mode);
    } catch {
      // ignore status re-fetch failure
    }
    if (!result.swapped) {
      throw new Error(result.error || 'refresh failed');
    }
  }, []);

  const search = useCallback(async (type: string, q: string): Promise<string[]> => {
    return searchMaster(type, q);
  }, []);

  const value = useMemo<MasterCacheContextValue>(
    () => ({
      mode,
      isSnapshotMode: mode === 'snapshot',
      isColdStartMode: mode === 'cold_start',
      triggerRefresh,
      search,
    }),
    [mode, triggerRefresh, search],
  );

  return <MasterCacheContext.Provider value={value}>{children}</MasterCacheContext.Provider>;
}
