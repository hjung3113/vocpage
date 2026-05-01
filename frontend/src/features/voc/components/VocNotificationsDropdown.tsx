import { NotificationBell } from '../../../components/common/NotificationBell';
import type { NotificationItem } from '../../../components/common/NotificationBell';

interface VocNotificationsDropdownProps {
  items: NotificationItem[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onItemClick: (id: string) => void;
}

export function VocNotificationsDropdown({
  items,
  unreadCount,
  onMarkAllRead,
  onItemClick,
}: VocNotificationsDropdownProps) {
  return (
    <NotificationBell
      items={items}
      unreadCount={unreadCount}
      onMarkAllRead={onMarkAllRead}
      onItemClick={onItemClick}
    />
  );
}

export default VocNotificationsDropdown;
