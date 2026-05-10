import { useContext } from 'react';
import { VocFilterContext } from './VocFilterContext';
import type { VocFilterContextValue } from './VocFilterContext';

export function useVocFilterContext(): VocFilterContextValue {
  const ctx = useContext(VocFilterContext);
  if (!ctx) throw new Error('useVocFilterContext must be used within VOCFilterProvider');
  return ctx;
}
