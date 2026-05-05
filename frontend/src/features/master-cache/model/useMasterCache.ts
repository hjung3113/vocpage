import { useContext } from 'react';
import { MasterCacheContext } from './MasterCacheContext';
import type { MasterCacheContextValue } from './MasterCacheContext';

export function useMasterCache(): MasterCacheContextValue {
  const ctx = useContext(MasterCacheContext);
  if (!ctx) throw new Error('useMasterCache must be used within MasterCacheProvider');
  return ctx;
}
