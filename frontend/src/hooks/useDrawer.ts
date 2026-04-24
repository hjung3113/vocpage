import { useContext } from 'react';
import { VOCDrawerContext, VOCDrawerContextValue } from '../contexts/VOCDrawerContext';

export function useDrawer(): VOCDrawerContextValue {
  const ctx = useContext(VOCDrawerContext);
  if (!ctx) throw new Error('useDrawer must be used within VOCDrawerProvider');
  return ctx;
}
