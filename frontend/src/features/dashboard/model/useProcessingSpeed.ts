/**
 * useProcessingSpeed — Wave 2 Phase C.
 * Queries /api/dashboard/processing-speed.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ProcessingSpeedDim } from '@contracts/dashboard';
import { dashboardApi } from '../api/queries';
import { dashboardQueryKeys } from '../api/keys';
import { useDashboardFilter } from './dashboardFilter';

export function useProcessingSpeed() {
  const { filter } = useDashboardFilter();
  const [dim, setDim] = useState<ProcessingSpeedDim>('all');

  const queryFilter = { ...filter, dim };
  const query = useQuery({
    queryKey: dashboardQueryKeys.processingSpeed(queryFilter),
    queryFn: () => dashboardApi.getProcessingSpeed(queryFilter),
    staleTime: 30_000,
  });

  return { ...query, dim, setDim };
}
