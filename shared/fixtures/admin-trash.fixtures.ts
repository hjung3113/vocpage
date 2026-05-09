/**
 * @module shared/fixtures/admin-trash.fixtures
 *
 * Deterministic trash fixtures for FE MSW + BE Jest tests (Wave 3 Phase C · W3-5).
 * All rows have deleted_at IS NOT NULL (soft-deleted VOCs).
 *
 * Schema: shared/contracts/admin/trash.ts → TrashListItem / VocRestoreLogEntry.
 * 4 rows: 3 parent VOCs deleted + 1 sub-task deleted (sub-task has a parent that is active).
 */
import type {
  TrashListItem,
  VocRestoreLogEntry,
  VocRestoreResponse,
} from '../contracts/admin/trash';

const SYS_A = '11111111-1111-4111-8111-111111111111';
const SYS_B = '22222222-2222-4222-8222-222222222222';
const MENU  = '44444444-4444-4444-8444-444444444444';

export const ADMIN_ID   = '00000000-0000-4000-8000-0000000000a1';
export const MANAGER_ID = '00000000-0000-4000-8000-0000000000b1';

/** 4 soft-deleted rows: 3 parent VOCs + 1 sub-task */
export const TRASH_FIXTURES: TrashListItem[] = [
  {
    id: 'dead0001-dead-4ead-8ead-dead00000001',
    issue_code: 'VOC-TRASH-001',
    title: '삭제된 VOC 1 — 시스템A',
    status: '접수',
    system_id: SYS_A,
    menu_id: MENU,
    deleted_by: MANAGER_ID,
    deleted_at: '2026-04-28T09:00:00.000Z',
  },
  {
    id: 'dead0002-dead-4ead-8ead-dead00000002',
    issue_code: 'VOC-TRASH-002',
    title: '삭제된 VOC 2 — 검토중',
    status: '검토중',
    system_id: SYS_B,
    menu_id: MENU,
    deleted_by: ADMIN_ID,
    deleted_at: '2026-04-25T14:30:00.000Z',
  },
  {
    id: 'dead0003-dead-4ead-8ead-dead00000003',
    issue_code: 'VOC-TRASH-003',
    title: '삭제된 VOC 3 — 처리중',
    status: '처리중',
    system_id: SYS_A,
    menu_id: MENU,
    deleted_by: null,
    deleted_at: '2026-04-20T10:00:00.000Z',
  },
  {
    // Sub-task: only this sub-task was soft-deleted (parent VOC is still active)
    id: 'dead0004-dead-4ead-8ead-dead00000004',
    issue_code: 'VOC-TRASH-004',
    title: '삭제된 서브태스크',
    status: '접수',
    system_id: SYS_A,
    menu_id: MENU,
    deleted_by: MANAGER_ID,
    deleted_at: '2026-04-22T08:00:00.000Z',
  },
];

/** Restore log entries for fixture vocs */
export const TRASH_RESTORE_LOG_FIXTURES: VocRestoreLogEntry[] = [
  {
    id: 'log00001-log0-4og0-8og0-log000000001',
    voc_id: 'dead0002-dead-4ead-8ead-dead00000002',
    action: 'restore',
    actor_id: ADMIN_ID,
    before_deleted_at: '2026-04-25T14:30:00.000Z',
    before_deleted_by: ADMIN_ID,
    created_at: '2026-04-29T11:00:00.000Z',
  },
];

/** Factory for a restore response (used by MSW handler) */
export function makeRestoreResponse(vocId: string): VocRestoreResponse {
  const now = new Date().toISOString();
  return {
    voc_id: vocId,
    restored_at: now,
    audit: {
      id: 'log00002-log0-4og0-8og0-log000000002',
      voc_id: vocId,
      action: 'restore',
      actor_id: ADMIN_ID,
      before_deleted_at: '2026-04-28T09:00:00.000Z',
      before_deleted_by: MANAGER_ID,
      created_at: now,
    },
  };
}
