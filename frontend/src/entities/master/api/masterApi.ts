import { apiGet } from '@shared/api/client';
import {
  AssigneeListItem,
  AssigneeListResponse,
  TagListItem,
  TagListResponse,
  VocTypeListItem,
  VocTypeListResponse,
} from '@contracts/master';

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
