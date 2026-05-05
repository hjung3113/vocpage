import React, { createContext, useMemo, useState } from 'react';

export interface MasterCacheContextValue {
  isSnapshotMode: boolean;
  /** Phase 7 API interceptor에서만 호출할 것. 컴포넌트에서 직접 호출 금지. */
  setSnapshotMode: (value: boolean) => void;
}

export const MasterCacheContext = createContext<MasterCacheContextValue | null>(null);

export function MasterCacheProvider({ children }: { children: React.ReactNode }) {
  const [isSnapshotMode, setSnapshotMode] = useState(false);

  const value = useMemo(() => ({ isSnapshotMode, setSnapshotMode }), [isSnapshotMode]);

  return <MasterCacheContext.Provider value={value}>{children}</MasterCacheContext.Provider>;
}
