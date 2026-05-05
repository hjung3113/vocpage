/**
 * Master data API client — mirrors backend `/api/masters/*` (PR-α). Each
 * call returns the validated rows array. Used by VOC advanced filters and
 * create modal selects.
 */
import { apiGet } from '@shared/api/client';
import {
  AssigneeListItem,
  AssigneeListResponse,
  TagListItem,
  TagListResponse,
  VocTypeListItem,
  VocTypeListResponse,
} from '../../../shared/contracts/master';

export const mastersApi = {
  assignees(): Promise<AssigneeListItem[]> {
    return apiGet('/api/masters/assignees', AssigneeListResponse).then((r) => r.rows);
  },
  tags(): Promise<TagListItem[]> {
    return apiGet('/api/masters/tags', TagListResponse).then((r) => r.rows);
  },
  vocTypes(): Promise<VocTypeListItem[]> {
    return apiGet('/api/masters/voc-types', VocTypeListResponse).then((r) => r.rows);
  },
};
