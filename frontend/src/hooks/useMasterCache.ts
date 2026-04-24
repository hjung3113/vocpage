import { useContext } from 'react';
import { MasterCacheContext, MasterCacheContextValue } from '../contexts/MasterCacheContext';

export function useMasterCache(): MasterCacheContextValue {
  const ctx = useContext(MasterCacheContext);
  if (!ctx) throw new Error('useMasterCache must be used within MasterCacheProvider');
  return ctx;
}
