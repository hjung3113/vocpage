import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AppNotification, getNotifications, getUnreadCount, markRead } from '../api/notifications';

export type { AppNotification };

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  hasUrgentUnread: boolean;
  isPolling: boolean;
  markAsRead: (id: string) => Promise<void>;
  refetchPanel: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
      const newUnread = data.filter((n) => !n.is_read).length;
      setUnreadCount(newUnread);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let retries = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    setIsPolling(true);

    const poll = async () => {
      if (cancelled) return;
      if (document.visibilityState === 'hidden') {
        timer = setTimeout(poll, 30_000);
        return;
      }
      try {
        const result = await getUnreadCount(etagRef.current);
        if (result !== null) {
          etagRef.current = result.etag;
          setUnreadCount(result.count);
        }
        retries = 0;
      } catch {
        if (retries < 3) {
          retries++;
          timer = setTimeout(poll, 1000 * Math.pow(2, retries - 1));
          return;
        }
      }
      if (!cancelled) {
        timer = setTimeout(poll, 30_000);
      }
    };

    void poll();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timer);
        void poll();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
      setIsPolling(false);
    };
  }, [user]);

  const hasUrgentUnread = useMemo(
    () => notifications.some((n) => n.voc_priority === 'urgent' && !n.is_read),
    [notifications],
  );

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
