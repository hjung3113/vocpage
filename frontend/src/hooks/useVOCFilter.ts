import { useContext } from 'react';
import { VOCFilterContext, VOCFilterContextValue } from '../contexts/VOCFilterContext';

export function useVOCFilter(): VOCFilterContextValue {
  const ctx = useContext(VOCFilterContext);
  if (!ctx) throw new Error('useVOCFilter must be used within VOCFilterProvider');
  return ctx;
}
