import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vocApi } from '@entities/voc/api/vocApi';
import { vocQueryKeys } from '@entities/voc';
import { useRole } from '@entities/user/model/useRole';
import type { VocUpdate, VocDetail } from '@contracts/voc';

export function useChangeVocStatus() {
  const qc = useQueryClient();
  const { role } = useRole();
  return useMutation<VocDetail, Error, { id: string; patch: VocUpdate }>({
    mutationFn: ({ id, patch }) => vocApi.update(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: vocQueryKeys.all(role) });
      qc.invalidateQueries({ queryKey: vocQueryKeys.detail(role, id) });
      qc.invalidateQueries({ queryKey: vocQueryKeys.history(role, id) });
    },
  });
}
