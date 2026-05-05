import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vocApi } from '@entities/voc/api/vocApi';
import { queryKeys } from '../../../api/queryKeys';
import { useRole } from '@features/auth/model/useRole';
import type { VocCreate, VocDetail } from '@contracts/voc';

export function useCreateVoc() {
  const qc = useQueryClient();
  const { role } = useRole();
  return useMutation<VocDetail, Error, VocCreate>({
    mutationFn: (payload: VocCreate) => vocApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.voc.all(role) });
    },
  });
}
