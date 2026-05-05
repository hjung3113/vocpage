import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { vocApi, vocQueryKeys } from '@entities/voc';
import { useRole } from '@entities/user/model/useRole';
import type { VocUpdate } from '../../../../shared/contracts/voc';

export function useUpdateVoc() {
  const qc = useQueryClient();
  const { role } = useRole();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: VocUpdate }) => vocApi.update(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: vocQueryKeys.all(role) });
      qc.invalidateQueries({ queryKey: vocQueryKeys.detail(role, id) });
      qc.invalidateQueries({ queryKey: vocQueryKeys.history(role, id) });
    },
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  const { role } = useRole();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => vocApi.addNote(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: vocQueryKeys.notes(role, id) });
    },
  });
}

export function useNotes(vocId: string | null) {
  const { role } = useRole();
  return useQuery({
    queryKey: vocId ? vocQueryKeys.notes(role, vocId) : ['voc', role, 'notes', 'none'],
    queryFn: () => vocApi.notes(vocId!),
    enabled: !!vocId,
  });
}
