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
  type VocCreate,
  InternalNote,
  InternalNoteListResponse,
  InternalNoteCreate,
  VocHistoryListResponse,
  type VocHistoryEntry,
} from '../../../shared/contracts/voc';

function toQs(query: Partial<VocListQuery>): string {
  const params = new URLSearchParams();
  if (query.status) for (const s of query.status) params.append('status', s);
  if (query.system_id) params.set('system_id', query.system_id);
  if (query.voc_type_ids) for (const t of query.voc_type_ids) params.append('voc_type_ids', t);
  if (query.assignees) for (const a of query.assignees) params.append('assignees', a);
  if (query.priorities) for (const p of query.priorities) params.append('priorities', p);
  if (query.tag_ids) for (const t of query.tag_ids) params.append('tag_ids', t);
  if (query.q) params.set('q', query.q);
  if (query.sort_by) params.set('sort_by', query.sort_by);
  if (query.sort_dir) params.set('sort_dir', query.sort_dir);
  if (query.page) params.set('page', String(query.page));
  if (query.per_page) params.set('per_page', String(query.per_page));
  if (query.includeDeleted) params.set('includeDeleted', 'true');
  const s = params.toString();
  return s ? `?${s}` : '';
}

export const vocApi = {
  list(query: Partial<VocListQuery> = {}): Promise<VocListResponse> {
    return apiGet(`/api/vocs${toQs(query)}`, VocListResponse);
  },
  create(payload: VocCreate): Promise<VocDetail> {
    return apiPost(`/api/vocs`, payload, VocDetail);
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
  history(id: string): Promise<VocHistoryEntry[]> {
    return apiGet(`/api/vocs/${id}/history`, VocHistoryListResponse).then((r) => r.rows);
  },
};
