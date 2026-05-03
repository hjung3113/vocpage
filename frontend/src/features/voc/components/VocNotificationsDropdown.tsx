import { Popover } from '../../../components/ui/popover';
import { NotifButton } from './NotifButton';
import { NotifPanel } from './NotifPanel';
import type { NotificationItem } from '../../../../../shared/contracts/notification/io';

export interface VocNotificationsDropdownProps {
  items: NotificationItem[];
  unreadCount: number;
  onMarkAllRead?: () => void;
  onItemClick?: (id: string) => void;
}

const noop = () => {};

export function VocNotificationsDropdown({
  items,
  unreadCount,
  onMarkAllRead = noop,
  onItemClick = noop,
}: VocNotificationsDropdownProps) {
  return (
    <div data-pcomp="voc-notif-dropdown">
      <Popover>
        <NotifButton unreadCount={unreadCount} />
        <NotifPanel
          items={items}
          unreadCount={unreadCount}
          onMarkAllRead={onMarkAllRead}
          onItemClick={onItemClick}
        />
      </Popover>
    </div>
  );
}

export default VocNotificationsDropdown;
