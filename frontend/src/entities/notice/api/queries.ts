import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '@shared/api/client';
import {
  Notice,
  NoticeListResponse,
  NoticePopupResponse,
  type NoticeCreate,
  type NoticeListQuery,
  type NoticeUpdate,
} from '@contracts/notice';
import { noticeQueryKeys } from './keys';

function toQs(query: Partial<NoticeListQuery>): string {
  const params = new URLSearchParams();
  if (query.mode) params.set('mode', query.mode);
  if (query.includeDeleted) params.set('includeDeleted', 'true');
  if (query.page) params.set('page', String(query.page));
  if (query.per_page) params.set('per_page', String(query.per_page));
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const noticeApi = {
  list(query: Partial<NoticeListQuery> = {}): Promise<NoticeListResponse> {
    return apiGet(`/api/notices${toQs(query)}`, NoticeListResponse);
  },
  get(id: string): Promise<Notice> {
    return apiGet(`/api/notices/${id}`, Notice);
  },
  popup(): Promise<NoticePopupResponse> {
    return apiGet(`/api/notices/popup`, NoticePopupResponse);
  },
  create(payload: NoticeCreate): Promise<Notice> {
    return apiPost(`/api/notices`, payload, Notice);
  },
  update(id: string, patch: NoticeUpdate): Promise<Notice> {
    return apiPatch(`/api/notices/${id}`, patch, Notice);
  },
  remove(id: string): Promise<void> {
    return apiDelete(`/api/notices/${id}`);
  },
  restore(id: string): Promise<Notice> {
    return apiPost(`/api/notices/${id}/restore`, {}, Notice);
  },
};

export function useNoticeList(query: Partial<NoticeListQuery> = {}) {
  return useQuery({
    queryKey: noticeQueryKeys.list(query),
    queryFn: () => noticeApi.list(query),
  });
}

export function useNoticeDetail(id: string | null) {
  return useQuery({
    queryKey: id ? noticeQueryKeys.detail(id) : ['notice', 'detail', 'none'],
    queryFn: () => noticeApi.get(id!),
    enabled: !!id,
  });
}

export function useNoticePopup() {
  return useQuery({
    queryKey: noticeQueryKeys.popup(),
    queryFn: () => noticeApi.popup(),
  });
}

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: NoticeCreate) => noticeApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: noticeQueryKeys.all });
    },
  });
}

export function useUpdateNotice(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: NoticeUpdate) => noticeApi.update(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: noticeQueryKeys.all });
    },
  });
}

export function useDeleteNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => noticeApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: noticeQueryKeys.all });
    },
  });
}

export function useRestoreNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => noticeApi.restore(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: noticeQueryKeys.all });
    },
  });
}
