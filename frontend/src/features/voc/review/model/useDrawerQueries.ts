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

export function useVocDetailByCode(issueCode: string | null) {
  const { role } = useRole();
  return useQuery({
    queryKey: issueCode
      ? ['voc', role, 'detail-by-code', issueCode]
      : ['voc', role, 'detail-by-code', 'none'],
    queryFn: () => vocApi.getByCode(issueCode!),
    enabled: !!issueCode,
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

export function useVocComments(id: string) {
  const { role } = useRole();
  return useQuery({
    queryKey: vocQueryKeys.comments(role, id),
    queryFn: () => vocApi.comments(id),
    enabled: !!id,
  });
}

export function useVocSubtasks(id: string) {
  const { role } = useRole();
  return useQuery({
    queryKey: vocQueryKeys.subtasks(role, id),
    queryFn: () => vocApi.subtasks(id),
    enabled: !!id,
  });
}
