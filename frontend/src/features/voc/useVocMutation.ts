import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { vocApi } from '../../api/voc';
import { queryKeys } from '../../api/queryKeys';
import { useRole } from '@features/auth/model/useRole';
import type { VocUpdate } from '../../../../shared/contracts/voc';

export function useUpdateVoc() {
  const qc = useQueryClient();
  const { role } = useRole();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: VocUpdate }) => vocApi.update(id, patch),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.voc.all(role) });
      qc.invalidateQueries({ queryKey: queryKeys.voc.detail(role, id) });
      qc.invalidateQueries({ queryKey: queryKeys.voc.history(role, id) });
    },
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  const { role } = useRole();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => vocApi.addNote(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.voc.notes(role, id) });
    },
  });
}

export function useNotes(vocId: string | null) {
  const { role } = useRole();
  return useQuery({
    queryKey: vocId ? queryKeys.voc.notes(role, vocId) : ['voc', role, 'notes', 'none'],
    queryFn: () => vocApi.notes(vocId!),
    enabled: !!vocId,
  });
}
