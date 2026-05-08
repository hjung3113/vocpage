/**
 * Notice popup trigger — Wave 4 FE step 4.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.3.2.
 *
 * Combines `useNoticePopup` (BE-fed list of is_popup notices, importance desc)
 * with localStorage `notice_dismiss_until_<userId>` to decide whether to show
 * the login popup modal. BE is stateless about per-user dismissal — that lives
 * in localStorage per the spec.
 */
import { useNoticePopup } from '@entities/notice';
import { useAuth } from '@features/auth';
import type { NoticePopupResponse } from '@entities/notice';

export const NOTICE_DISMISS_KEY_PREFIX = 'notice_dismiss_until_';

/** Today's date (KST) as YYYY-MM-DD. en-CA locale produces ISO date format. */
export function todayKst(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

/** Tomorrow's date (KST) as YYYY-MM-DD. */
export function tomorrowKst(now: Date = new Date()): string {
  const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return todayKst(next);
}

export function dismissKey(userId: string): string {
  return `${NOTICE_DISMISS_KEY_PREFIX}${userId}`;
}

export interface NoticePopupTrigger {
  /** True when the popup modal should be visible. */
  shouldShow: boolean;
  /** Notices to render in the modal (importance desc — BE order). */
  rows: NoticePopupResponse['rows'];
  /** Current userId, or null when logged out. */
  userId: string | null;
}

export function useNoticePopupTrigger(): NoticePopupTrigger {
  const { user } = useAuth();
  const { data, isError, isPending } = useNoticePopup();

  const userId = user?.id ?? null;
  const rows = data?.rows ?? [];

  if (!userId || isPending || isError || rows.length === 0) {
    return { shouldShow: false, rows, userId };
  }

  let dismissed = false;
  try {
    const stored = window.localStorage.getItem(dismissKey(userId));
    if (stored && stored >= todayKst()) dismissed = true;
  } catch {
    /* localStorage unavailable — proceed to show */
  }

  return { shouldShow: !dismissed, rows, userId };
}
