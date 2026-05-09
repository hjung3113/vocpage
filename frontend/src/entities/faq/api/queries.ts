import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '@shared/api/client';
import {
  Faq,
  FaqCategory,
  FaqCategoryListResponse,
  FaqListResponse,
  type FaqCategoryCreate,
  type FaqCategoryUpdate,
  type FaqCreate,
  type FaqListQuery,
  type FaqUpdate,
} from '@contracts/faq';
import { faqQueryKeys } from './keys';

function toQs(query: Partial<FaqListQuery>): string {
  const params = new URLSearchParams();
  if (query.mode) params.set('mode', query.mode);
  if (query.category_id) params.set('category_id', query.category_id);
  if (query.q) params.set('q', query.q);
  if (query.includeDeleted) params.set('includeDeleted', 'true');
  if (query.page) params.set('page', String(query.page));
  if (query.per_page) params.set('per_page', String(query.per_page));
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const faqApi = {
  list(query: Partial<FaqListQuery> = {}): Promise<FaqListResponse> {
    return apiGet(`/api/faqs${toQs(query)}`, FaqListResponse);
  },
  get(id: string): Promise<Faq> {
    return apiGet(`/api/faqs/${id}`, Faq);
  },
  create(payload: FaqCreate): Promise<Faq> {
    return apiPost(`/api/faqs`, payload, Faq);
  },
  update(id: string, patch: FaqUpdate): Promise<Faq> {
    return apiPatch(`/api/faqs/${id}`, patch, Faq);
  },
  remove(id: string): Promise<void> {
    return apiDelete(`/api/faqs/${id}`);
  },
  restore(id: string): Promise<Faq> {
    return apiPost(`/api/faqs/${id}/restore`, {}, Faq);
  },
  categories(): Promise<FaqCategoryListResponse> {
    return apiGet(`/api/faq-categories`, FaqCategoryListResponse);
  },
  createCategory(payload: FaqCategoryCreate): Promise<FaqCategory> {
    return apiPost(`/api/faq-categories`, payload, FaqCategory);
  },
  updateCategory(id: string, patch: FaqCategoryUpdate): Promise<FaqCategory> {
    return apiPatch(`/api/faq-categories/${id}`, patch, FaqCategory);
  },
  removeCategory(id: string): Promise<void> {
    return apiDelete(`/api/faq-categories/${id}`);
  },
};

export function useFaqList(query: Partial<FaqListQuery> = {}) {
  return useQuery({
    queryKey: faqQueryKeys.list(query),
    queryFn: () => faqApi.list(query),
  });
}

export function useFaqSearch(q: string) {
  return useQuery({
    queryKey: faqQueryKeys.list({ q }),
    queryFn: () => faqApi.list({ q }),
    enabled: q.trim().length > 0,
  });
}

export function useFaqDetail(id: string | null) {
  return useQuery({
    queryKey: id ? faqQueryKeys.detail(id) : ['faq', 'detail', 'none'],
    queryFn: () => faqApi.get(id!),
    enabled: !!id,
  });
}

export function useFaqCategories() {
  return useQuery({
    queryKey: faqQueryKeys.categories(),
    queryFn: () => faqApi.categories(),
  });
}

export function useCreateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FaqCreate) => faqApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: faqQueryKeys.all });
    },
  });
}

export function useUpdateFaq(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: FaqUpdate) => faqApi.update(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: faqQueryKeys.all });
    },
  });
}

export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => faqApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: faqQueryKeys.all });
    },
  });
}

export function useRestoreFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => faqApi.restore(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: faqQueryKeys.all });
    },
  });
}

export function useCreateFaqCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FaqCategoryCreate) => faqApi.createCategory(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: faqQueryKeys.categories() });
    },
  });
}

export function useUpdateFaqCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: FaqCategoryUpdate) => faqApi.updateCategory(id, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: faqQueryKeys.categories() });
    },
  });
}

export function useDeleteFaqCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => faqApi.removeCategory(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: faqQueryKeys.categories() });
    },
  });
}
