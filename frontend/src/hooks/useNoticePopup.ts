import { useEffect, useState } from 'react';
import { listPopupNotices, type Notice } from '../api/notices';

function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function isDismissedToday(id: string): boolean {
  return localStorage.getItem(`notice_dismiss_${id}_${getTodayKey()}`) === '1';
}

export function useNoticePopup() {
  const [popupNotices, setPopupNotices] = useState<Notice[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    listPopupNotices()
      .then(({ notices }) => {
        const undismissed = notices.filter((n) => !isDismissedToday(n.id));
        if (undismissed.length > 0) {
          setPopupNotices(undismissed);
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
