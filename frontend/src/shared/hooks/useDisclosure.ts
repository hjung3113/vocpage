import { useContext } from 'react';
import { VOCDrawerContext, VOCDrawerContextValue } from '../../contexts/VOCDrawerContext';

export function useDisclosure(): VOCDrawerContextValue {
  const ctx = useContext(VOCDrawerContext);
  if (!ctx) throw new Error('useDisclosure must be used within VOCDrawerProvider');
  return ctx;
}
