/**
 * @module shared/fixtures/voc.fixtures
 *
 * 50 deterministic VOC fixtures spanning the role/status/system matrix used by
 *  - FE MSW handlers (`frontend/src/mocks/handlers/voc.ts`)
 *  - BE Jest tests (mocked repository injection — Wave 1 §U3 decision)
 *
 * Design constraints:
 *  - Stable UUIDs (no Math.random) so fixtures round-trip across runs.
 *  - 3 systems × 5 statuses + permission-edge cases (deleted, length-overflow,
 *    dev-self assignee, user-author).
 *  - Schema is the source of truth: every row passes `Voc.parse()`.
 */
import { Voc, type Voc as VocT } from '../contracts/voc/entity';
import {
  InternalNote,
  type InternalNote as InternalNoteT,
  VocHistoryEntry,
  type VocHistoryEntry as VocHistoryEntryT,
} from '../contracts/voc/note';
import { FIXTURE_USERS } from '../contracts/voc/users';

export { FIXTURE_USERS };

const SYS = {
  ANALYSIS: '11111111-1111-4111-8111-111111111111',
  REPORT: '22222222-2222-4222-8222-222222222222',
  PORTAL: '33333333-3333-4333-8333-333333333333',
} as const;

const MENU = '44444444-4444-4444-8444-444444444444';
const TYPE = '55555555-5555-4555-8555-555555555555';

const STATUSES = ['접수', '검토중', '처리중', '완료', '드랍'] as const;

const pad = (n: number) => String(n).padStart(4, '0');
const baseDate = (offsetDays: number) =>
  new Date(Date.UTC(2026, 4, 1) - offsetDays * 86_400_000).toISOString();

interface RowSpec {
  systemSlug: keyof typeof SYS;
  status: VocT['status'];
  priority: VocT['priority'];
  assigneeId: VocT['assignee_id'];
  authorId: VocT['author_id'];
  parentId?: VocT['parent_id'];
  deletedAt?: string | null;
  longTitle?: boolean;
}

const SPECS: ReadonlyArray<RowSpec> = (() => {
  const out: RowSpec[] = [];
  let n = 0;
  for (const sys of Object.keys(SYS) as Array<keyof typeof SYS>) {
    for (const status of STATUSES) {
      for (const priority of ['urgent', 'high', 'medium'] as const) {
        out.push({
          systemSlug: sys,
          status,
          priority,
          assigneeId: n % 4 === 0 ? FIXTURE_USERS.devSelf : FIXTURE_USERS.devOther,
          authorId: FIXTURE_USERS.user,
        });
        n += 1;
      }
    }
  }
  // edge cases
  out.push({
    systemSlug: 'ANALYSIS',
    status: '드랍',
    priority: 'low',
    assigneeId: null,
    authorId: FIXTURE_USERS.user,
    deletedAt: baseDate(2),
  });
  out.push({
    systemSlug: 'PORTAL',
    status: '검토중',
    priority: 'high',
    assigneeId: FIXTURE_USERS.devSelf,
    authorId: FIXTURE_USERS.user,
    longTitle: true,
  });
  out.push({
    systemSlug: 'REPORT',
    status: '처리중',
    priority: 'medium',
    assigneeId: FIXTURE_USERS.devSelf,
    authorId: FIXTURE_USERS.user,
  });
  out.push({
    systemSlug: 'ANALYSIS',
    status: '접수',
    priority: 'low',
    assigneeId: null,
    authorId: FIXTURE_USERS.user,
  });
  out.push({
    systemSlug: 'ANALYSIS',
    status: '처리중',
    priority: 'high',
    assigneeId: FIXTURE_USERS.devSelf,
    authorId: FIXTURE_USERS.user,
    parentId: 'aaaaaaaa-0000-4000-8000-100000000001',
  });
  return out.slice(0, 50);
})();

export const VOC_FIXTURES: ReadonlyArray<VocT> = SPECS.map((s, i) => {
  const created = baseDate(i);
  return Voc.parse({
    id: `aaaaaaaa-0000-4000-8000-${pad(i + 1).padStart(12, '0')}`,
    issue_code: `${s.systemSlug}-2026-${pad(i + 1)}`,
    sequence_no: i + 1,
    title: s.longTitle
      ? '[LongTitle] '.repeat(15) + 'overflow guard'
      : `[${s.systemSlug}] sample VOC #${i + 1}`,
    body: 'lorem ipsum sample body content',
    status: s.status,
    priority: s.priority,
    voc_type_id: TYPE,
    system_id: SYS[s.systemSlug],
    menu_id: MENU,
    assignee_id: s.assigneeId,
    author_id: s.authorId,
    parent_id: s.parentId ?? null,
    source: 'manual',
    review_status: null,
    resolution_quality: null,
    drop_reason: s.status === '드랍' ? '기타' : null,
    due_date: null,
    deleted_at: s.deletedAt ?? null,
    created_at: created,
    updated_at: created,
  });
});

export const VOC_NOTES_FIXTURES: ReadonlyArray<InternalNoteT> = [
  InternalNote.parse({
    id: 'bbbbbbbb-0000-4000-8000-000000000001',
    voc_id: VOC_FIXTURES[0]!.id,
    author_id: FIXTURE_USERS.manager,
    body: 'Triage start — checking duplicates.',
    created_at: baseDate(0),
    updated_at: baseDate(0),
    deleted_at: null,
  }),
];

export const VOC_HISTORY_FIXTURES: ReadonlyArray<VocHistoryEntryT> = [
  VocHistoryEntry.parse({
    id: 'cccccccc-0000-4000-8000-000000000001',
    voc_id: VOC_FIXTURES[0]!.id,
    field: 'status',
    old_value: '접수',
    new_value: '검토중',
    changed_by: FIXTURE_USERS.manager,
    changed_at: baseDate(0),
  }),
];
