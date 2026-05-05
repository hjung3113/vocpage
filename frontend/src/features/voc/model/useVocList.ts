import { useQuery } from '@tanstack/react-query';
import { vocApi, vocQueryKeys } from '@entities/voc';
import { useRole } from '@entities/user/model/useRole';
import type { VocFilter, VocListQuery } from '@contracts/voc';

export function useVocList(
  filter: VocFilter,
  sort_by: VocListQuery['sort_by'],
  sort_dir: VocListQuery['sort_dir'],
  page = 1,
  per_page = 20,
) {
  const { role } = useRole();
  return useQuery({
    queryKey: vocQueryKeys.list(role, { ...filter, sort_by, sort_dir, page, per_page }),
    queryFn: () => vocApi.list({ ...filter, sort_by, sort_dir, page, per_page }),
    staleTime: 30_000,
  });
}
