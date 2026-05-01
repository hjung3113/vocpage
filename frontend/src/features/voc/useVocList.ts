import { useQuery } from '@tanstack/react-query';
import { vocApi } from '../../api/voc';
import { queryKeys } from '../../api/queryKeys';
import { useRole } from '../../hooks/useRole';
import type { VocFilter, VocListQuery } from '../../../../shared/contracts/voc';

export function useVocList(
  filter: VocFilter,
  sort_by: VocListQuery['sort_by'],
  sort_dir: VocListQuery['sort_dir'],
  page = 1,
  per_page = 20,
) {
  const { role } = useRole();
  return useQuery({
    queryKey: queryKeys.voc.list(role, { ...filter, sort_by, sort_dir, page, per_page }),
    queryFn: () => vocApi.list({ ...filter, sort_by, sort_dir, page, per_page }),
    staleTime: 30_000,
  });
}
