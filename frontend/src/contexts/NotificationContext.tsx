import React, { createContext, useCallback, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export interface AppNotification {
  id: string;
  vocId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  /** Phase 7: 실제 API 폴링은 Phase 7에서 구현 */
  isPolling: false;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // user 정보는 보유하되, Phase 7 폴링 구현 시 사용
  const { user } = useAuth();
  void user; // Phase 7에서 폴링 트리거용으로 사용 예정

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      isPolling: false as const,
    }),
    [notifications, unreadCount, markAsRead, markAllAsRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
