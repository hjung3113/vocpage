import { useEffect, useState } from 'react';
import { listPopupNotices, type Notice } from '../api/notices';

const DISMISS_ALL_KEY = 'notice:dismissedUntil:all';

function isDismissedAll(): boolean {
  const value = localStorage.getItem(DISMISS_ALL_KEY);
  if (!value) return false;
  return new Date(value) > new Date();
}

export function useNoticePopup() {
  const [popupNotices, setPopupNotices] = useState<Notice[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isDismissedAll()) return;
    listPopupNotices()
      .then(({ notices }) => {
        if (notices.length > 0) {
          setPopupNotices(notices);
          setIsVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  const closePopup = () => {
    setIsVisible(false);
  };

  return { popupNotices, isVisible, closePopup };
}
