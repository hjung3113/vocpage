import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vocApi } from '@entities/voc/api/vocApi';
import { queryKeys } from '../../../api/queryKeys';
import { useRole } from '@features/auth/model/useRole';
import type { VocUpdate, VocDetail } from '@contracts/voc';

export function useChangeVocStatus() {
  const qc = useQueryClient();
  const { role } = useRole();
  return useMutation<VocDetail, Error, { id: string; patch: VocUpdate }>({
    mutationFn: ({ id, patch }) => vocApi.update(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.voc.all(role) });
      qc.invalidateQueries({ queryKey: queryKeys.voc.detail(role, id) });
      qc.invalidateQueries({ queryKey: queryKeys.voc.history(role, id) });
    },
  });
}
