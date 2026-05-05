import { useQuery } from '@tanstack/react-query';
import { vocApi, vocQueryKeys } from '@entities/voc';
import { useRole } from '@entities/user/model/useRole';

export function useVocDetail(id: string | null) {
  const { role } = useRole();
  return useQuery({
    queryKey: id ? vocQueryKeys.detail(role, id) : ['voc', role, 'detail', 'none'],
    queryFn: () => vocApi.get(id!),
    enabled: !!id,
  });
}

export function useVocHistory(id: string | null) {
  const { role } = useRole();
  return useQuery({
    queryKey: id ? vocQueryKeys.history(role, id) : ['voc', role, 'history', 'none'],
    queryFn: () => vocApi.history(id!),
    enabled: !!id,
  });
}

export function useVocComments(id: string | null) {
  const { role } = useRole();
  return useQuery({
    queryKey: id ? vocQueryKeys.comments(role, id) : ['voc', role, 'comments', 'none'],
    queryFn: () => vocApi.comments(id!),
    enabled: !!id,
  });
}

export function useVocSubtasks(id: string | null) {
  const { role } = useRole();
  return useQuery({
    queryKey: id ? vocQueryKeys.subtasks(role, id) : ['voc', role, 'subtasks', 'none'],
    queryFn: () => vocApi.subtasks(id!),
    enabled: !!id,
  });
}
