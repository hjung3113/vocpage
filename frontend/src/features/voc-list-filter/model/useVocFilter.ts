import { useContext } from 'react';
import { VOCFilterContext } from './VocFilterContext';
import type { VOCFilterContextValue } from './VocFilterContext';

export function useVocFilter(): VOCFilterContextValue {
  const ctx = useContext(VOCFilterContext);
  if (!ctx) throw new Error('useVocFilter must be used within VOCFilterProvider');
  return ctx;
}
