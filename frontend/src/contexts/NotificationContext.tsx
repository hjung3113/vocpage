import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AppNotification, getNotifications, getUnreadCount, markRead } from '../api/notifications';

export type { AppNotification };

const POLLING_INTERVAL_MS = 30_000;

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  hasUrgentUnread: boolean;
  isPolling: boolean;
  markAsRead: (id: string) => Promise<void>;
  refetchPanel: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

function is401(err: unknown): boolean {
  if (err instanceof Error && err.message.includes('401')) return true;
  if (typeof err === 'object' && err !== null && 'status' in err) {
    return (err as { status?: number }).status === 401;
  }
  return false;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUrgentUnread, setHasUrgentUnread] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const etagRef = useRef<string | undefined>(undefined);

  const markAsRead = useCallback(async (id: string) => {
    await markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const refetchPanel = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      // Bulk-read happens server-side on this endpoint; reset unread state locally.
      setUnreadCount(0);
      setHasUrgentUnread(false);
    } catch (err) {
      if (is401(err)) {
        window.location.href = '/mock-login';
      }
      // otherwise silently ignore
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let retries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inflight = false;
    let cancelled = false;

    setIsPolling(true);

    const schedule = (delay: number) => {
      if (cancelled) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(poll, delay);
    };

    const poll = async () => {
      if (cancelled || inflight) return;
      if (document.visibilityState === 'hidden') {
        schedule(POLLING_INTERVAL_MS);
        return;
      }
      inflight = true;
      try {
        const result = await getUnreadCount(etagRef.current);
        if (!cancelled && result !== null) {
          etagRef.current = result.etag;
          setUnreadCount(result.count);
          setHasUrgentUnread(result.hasUrgent);
        }
        retries = 0;
      } catch (err: unknown) {
        if (is401(err)) {
          inflight = false;
          window.location.href = '/mock-login';
          return;
        }
        if (!cancelled && retries < 3) {
          retries++;
          inflight = false;
          schedule(1000 * Math.pow(2, retries - 1));
          return;
        }
        retries = 0; // reset after max failures so the next tick still fires
      } finally {
        inflight = false;
      }
      schedule(POLLING_INTERVAL_MS);
    };

    void poll();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (timer) clearTimeout(timer);
        void poll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
      setIsPolling(false);
    };
  }, [user]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      hasUrgentUnread,
      isPolling,
      markAsRead,
      refetchPanel,
    }),
    [notifications, unreadCount, hasUrgentUnread, isPolling, markAsRead, refetchPanel],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
