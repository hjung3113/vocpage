import { useContext } from 'react';
import { VocFilterContext } from './VocFilterContext';
import type { VocFilterContextValue } from './VocFilterContext';

export function useVocFilter(): VocFilterContextValue {
  const ctx = useContext(VocFilterContext);
  if (!ctx) throw new Error('useVocFilter must be used within VOCFilterProvider');
  return ctx;
}
