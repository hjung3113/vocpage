/**
 * Notifications service — single trigger module (W5-D5).
 *
 * Behaviour:
 *  - notifyOn{Comment,StatusChange,Assign}: enforce 5-minute debounce
 *    (W5-D3) and recipient-rules (`feature-voc.md §8.6`).
 *  - listNotifications: lazy trim (W5-D4), then map rows to DTO with
 *    `isUrgent` (W5-D2 — read-time priority join).
 *  - getUnreadCount: returns count + ETag string.
 *  - markAllRead / markOneRead.
 */
import * as repo from '../repository/notifications';
import * as vocRepo from '../repository/voc';
import type { NotificationItem } from '../../../shared/contracts/notification';

export type NotifyResult = { inserted: boolean; reason?: 'debounced' | 'self' | 'no-recipient' };

async function emit(
  user_id: string,
  type: repo.NotificationType,
  voc_id: string,
): Promise<NotifyResult> {
  if (await repo.hasRecentNotification(user_id, type, voc_id)) {
    return { inserted: false, reason: 'debounced' };
  }
  await repo.insertNotification({ user_id, type, voc_id });
  return { inserted: true };
}

/**
 * Resolve `feature-voc.md §3` "내 VOC" / line 52 "작성자 및 담당자" — the
 * recipient set for comment / status_change is `{author, assignee} \ {actor}`.
 */
function recipientsForVoc(
  voc: { author_id: string; assignee_id: string | null },
  actor_id: string,
): string[] {
  const set = new Set<string>();
  if (voc.author_id !== actor_id) set.add(voc.author_id);
  if (voc.assignee_id && voc.assignee_id !== actor_id) set.add(voc.assignee_id);
  return [...set];
}

async function emitMany(
  recipients: string[],
  type: repo.NotificationType,
  voc_id: string,
): Promise<NotifyResult> {
  if (recipients.length === 0) return { inserted: false, reason: 'no-recipient' };
  let inserted = 0;
  let debounced = 0;
  for (const uid of recipients) {
    const r = await emit(uid, type, voc_id);
    if (r.inserted) inserted++;
    else if (r.reason === 'debounced') debounced++;
  }
  if (inserted > 0) return { inserted: true };
  if (debounced > 0) return { inserted: false, reason: 'debounced' };
  return { inserted: false, reason: 'no-recipient' };
}

/**
 * Comment trigger — `feature-voc.md §8.6` ("내 VOC에 타인이 댓글 작성") +
 * line 52 (author + assignee). Comments are a public surface, so no
 * role-visibility filter is applied.
 */
export async function notifyOnComment(args: {
  voc_id: string;
  actor_id: string;
}): Promise<NotifyResult> {
  const voc = await vocRepo.getVocById(args.voc_id);
  if (!voc) return { inserted: false, reason: 'no-recipient' };
  return emitMany(recipientsForVoc(voc, args.actor_id), 'comment', args.voc_id);
}

/**
 * Status-change trigger — `feature-voc.md §3` line 52
 * ("작성자 및 담당자에게 인앱 알림 발송"). Skipped for the actor.
 */
export async function notifyOnStatusChange(args: {
  voc_id: string;
  actor_id: string;
}): Promise<NotifyResult> {
  const voc = await vocRepo.getVocById(args.voc_id);
  if (!voc) return { inserted: false, reason: 'no-recipient' };
  return emitMany(recipientsForVoc(voc, args.actor_id), 'status_change', args.voc_id);
}

/**
 * Assign trigger — `feature-voc.md §8.6`: "나에게 담당자 배정".
 * Recipient = the new assignee. Self-assignment is skipped.
 */
export async function notifyOnAssign(args: {
  voc_id: string;
  new_assignee_id: string | null;
  actor_id: string;
}): Promise<NotifyResult> {
  if (!args.new_assignee_id) return { inserted: false, reason: 'no-recipient' };
  if (args.new_assignee_id === args.actor_id) return { inserted: false, reason: 'self' };
  return emit(args.new_assignee_id, 'assigned', args.voc_id);
}

function labelFor(row: repo.NotificationRow): string {
  switch (row.type) {
    case 'comment':
      return `VOC ${row.voc_issue_code} 에 새 코멘트가 등록되었습니다.`;
    case 'status_change':
      return `VOC ${row.voc_issue_code} 상태가 변경되었습니다.`;
    case 'assigned':
      return `VOC ${row.voc_issue_code} 담당자로 지정되었습니다.`;
  }
}

function toItem(row: repo.NotificationRow): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    label: labelFor(row),
    href: `/voc/${row.voc_id}`,
    createdAt: row.created_at,
    read: row.read_at !== null,
    voc_id: row.voc_id,
    voc_issue_code: row.voc_issue_code,
    voc_title: row.voc_title,
    isUrgent: row.voc_priority === 'urgent',
  };
}

export interface ListResult {
  items: NotificationItem[];
  unreadCount: number;
}

export async function listNotifications(user_id: string): Promise<ListResult> {
  await repo.lazyTrim(user_id);
  const rows = await repo.listForUser(user_id);
  const items = rows.map(toItem);
  const unreadCount = items.filter((i) => !i.read).length;
  return { items, unreadCount };
}

export interface UnreadCountResult {
  count: number;
  etag: string;
}

export async function getUnreadCount(user_id: string): Promise<UnreadCountResult> {
  const s = await repo.unreadSummaryForUser(user_id);
  // ETag: weak hash that flips when count or the latest unread row changes.
  // `markAllRead` zeroes count + latest fields → distinct from any non-empty
  // state, so 304 cannot mask a transition.
  const etag = `W/"n-${s.count}-${s.latest_id ?? ''}-${s.latest_created_at ?? ''}"`;
  return { count: s.count, etag };
}

export async function markAllRead(user_id: string): Promise<void> {
  await repo.markAllRead(user_id);
}

export async function markOneRead(id: string, user_id: string): Promise<boolean> {
  return repo.markOneRead(id, user_id);
}
