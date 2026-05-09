/**
 * React Query hooks for in-app notifications (Wave 5 Phase B).
 *
 * Wave 5 Phase B contract gap reconciliation (user decision 2026-05-10):
 * `unread-count` endpoint omits `hasUrgent`, so the Sidebar 🔴! cannot be
 * derived from it. We poll the **list** endpoint every 30 s instead — count +
 * isUrgent are read from the same cache by Sidebar and the panel/page.
 * `useUnreadCountPolled` is a thin selector over `useNotificationsList`.
 *
 * `refetchIntervalInBackground` defaults to false → tab-hidden pause is free
 * (W5-D7 visibilityState requirement).
 *
 * 401 → redirect to /mock-login: handled inside the queryFn wrapper.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@shared/api/client';
import { notificationsApi } from './notificationApi';
import { notificationQueryKeys } from './notificationQueryKeys';

const POLL_MS = 30_000;

function redirectToLogin() {
  if (typeof window !== 'undefined' && window.location.pathname !== '/mock-login') {
    const next = window.location.pathname + window.location.search;
    window.location.href = `/mock-login?next=${encodeURIComponent(next)}`;
  }
}

async function fetchListWithAuthGuard() {
  try {
    return await notificationsApi.list();
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirectToLogin();
    }
    throw err;
  }
}

export function useNotificationsList(opts?: { poll?: boolean; enabled?: boolean }) {
  const poll = opts?.poll ?? true;
  return useQuery({
    queryKey: notificationQueryKeys.list(),
    queryFn: fetchListWithAuthGuard,
    refetchInterval: poll ? POLL_MS : false,
    enabled: opts?.enabled ?? true,
    staleTime: 0,
  });
}

/**
 * Selector hook — derives unread count + Urgent flag from the polled list.
 * Sidebar consumes this; the panel/page uses `useNotificationsList` directly.
 */
export function useUnreadBadge() {
  const q = useNotificationsList({ poll: true });
  const unreadCount = q.data?.unreadCount ?? 0;
  const hasUrgent = !!q.data?.items?.some((it) => !it.read && it.isUrgent);
  return { unreadCount, hasUrgent, isLoading: q.isLoading, isError: q.isError };
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}

export function useMarkOneRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markOneRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}
