/**
 * VOC API client — wraps shared `api*` helpers so call-sites import a single
 * surface. MSW vs real BE switch happens once in `main.tsx`; this module is
 * environment-agnostic.
 */
import { apiGet, apiPost, apiPatch } from './client';
import {
  VocListResponse,
  VocDetail,
  type VocUpdate,
  type VocListQuery,
  InternalNote,
  InternalNoteListResponse,
  InternalNoteCreate,
} from '../../../shared/contracts/voc';

function toQs(query: Partial<VocListQuery>): string {
  const params = new URLSearchParams();
  if (query.status) for (const s of query.status) params.append('status', s);
  if (query.system_id) params.set('system_id', query.system_id);
  if (query.voc_type_id) for (const t of query.voc_type_id) params.append('voc_type_id', t);
  if (query.assignee_id) params.set('assignee_id', query.assignee_id);
  if (query.q) params.set('q', query.q);
  if (query.sort) params.set('sort', query.sort);
  if (query.order) params.set('order', query.order);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.includeDeleted) params.set('includeDeleted', 'true');
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const vocApi = {
  list(query: Partial<VocListQuery> = {}): Promise<VocListResponse> {
    return apiGet(`/api/vocs${toQs(query)}`, VocListResponse);
  },
  get(id: string): Promise<VocDetail> {
    return apiGet(`/api/vocs/${id}`, VocDetail);
  },
  update(id: string, patch: VocUpdate): Promise<VocDetail> {
    return apiPatch(`/api/vocs/${id}`, patch, VocDetail);
  },
  notes(id: string): Promise<InternalNote[]> {
    return apiGet(`/api/vocs/${id}/notes`, InternalNoteListResponse).then((r) => r.rows);
  },
  addNote(id: string, body: string): Promise<InternalNote> {
    return apiPost(`/api/vocs/${id}/notes`, InternalNoteCreate.parse({ body }), InternalNote);
  },
};
