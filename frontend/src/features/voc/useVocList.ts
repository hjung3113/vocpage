import { useQuery } from '@tanstack/react-query';
import { vocApi } from '../../api/voc';
import { queryKeys } from '../../api/queryKeys';
import { useRole } from '../../hooks/useRole';
import type { VocFilter, VocListQuery } from '../../../../shared/contracts/voc';

export function useVocList(
  filter: VocFilter,
  sort: VocListQuery['sort'],
  order: VocListQuery['order'],
) {
  const { role } = useRole();
  return useQuery({
    queryKey: queryKeys.voc.list(role, { ...filter, sort, order }),
    queryFn: () => vocApi.list({ ...filter, sort, order, page: 1, limit: 50 }),
    staleTime: 30_000,
  });
}
