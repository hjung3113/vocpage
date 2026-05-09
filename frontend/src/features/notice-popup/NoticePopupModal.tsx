/**
 * Notice popup modal — Wave 4 FE step 4.
 * Spec: docs/specs/requires/feature-notice-faq.md §10.3.2.
 *
 * 2-panel modal regardless of row count:
 *   left  — popup-target list (importance desc, title + level badge),
 *   right — selected detail (sanitized richtext).
 * Default selection = highest-importance row (first in BE order).
 *
 * Footer: single "오늘 하루 보지 않기" checkbox + close button.
 *   - checked + close → save tomorrow's KST YYYY-MM-DD into
 *     `notice_dismiss_until_<userId>` localStorage key.
 *   - unchecked + close → no key write (popup re-shows next mount).
 */
import { useEffect, useState } from 'react';
import { Button } from '@shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@shared/ui/dialog';
import { SafeHtml } from '@shared/ui/safe-html/SafeHtml';
import { LevelBadge } from '@pages/notice/LevelBadge';
import {
  dismissKey,
  tomorrowKst,
  useNoticePopupTrigger,
} from './useNoticePopupTrigger';

export function NoticePopupModal() {
  const { shouldShow, rows, userId } = useNoticePopupTrigger();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dismiss, setDismiss] = useState(false);

  // Sync open state with trigger result on first match.
  useEffect(() => {
    if (shouldShow && !open) {
      setOpen(true);
      setSelectedId(rows[0]?.id ?? null);
      setDismiss(false);
    }
  }, [shouldShow, open, rows]);

  if (!shouldShow && !open) return null;

  const selected = rows.find((r) => r.id === selectedId) ?? rows[0] ?? null;

  function handleClose() {
    if (dismiss && userId) {
      try {
        window.localStorage.setItem(dismissKey(userId), tomorrowKst());
      } catch {
        /* ignore — surface stays usable even when storage is blocked */
      }
    }
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent
        data-testid="notice-popup-modal"
        className="max-w-3xl gap-0 p-0"
      >
        <DialogTitle className="sr-only">공지사항</DialogTitle>
        <DialogDescription className="sr-only">로그인 시 표시되는 팝업 공지 모달.</DialogDescription>
        <div className="flex h-[420px]">
          {/* Left: list */}
          <ul
            data-testid="notice-popup-list"
            className="w-1/3 overflow-auto border-r border-[color:var(--border-standard)] bg-[color:var(--bg-panel)]"
          >
            {rows.map((n) => {
              const active = selected?.id === n.id;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    data-testid={`notice-popup-item-${n.id}`}
                    aria-pressed={active}
                    onClick={() => setSelectedId(n.id)}
                    className="flex w-full flex-col gap-1 border-b border-[color:var(--border-standard)] px-3 py-2 text-left hover:bg-[color:var(--bg-surface)]"
                    style={{
                      background: active ? 'var(--bg-surface)' : undefined,
                    }}
                  >
                    <LevelBadge level={n.level} />
                    <span className="text-sm font-medium text-[color:var(--text-primary)]">
                      {n.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Right: detail */}
          <div className="flex-1 overflow-auto p-5">
            {selected ? (
              <>
                <h2
                  data-testid="notice-popup-detail-title"
                  className="mb-3 text-base font-semibold text-[color:var(--text-primary)]"
                >
                  {selected.title}
                </h2>
                <SafeHtml
                  html={selected.body}
                  data-testid={`notice-popup-detail-body-${selected.id}`}
                  className="text-sm text-[color:var(--text-primary)]"
                />
              </>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[color:var(--border-standard)] px-5 py-3">
          <label className="flex items-center gap-2 text-sm text-[color:var(--text-secondary)]">
            <input
              type="checkbox"
              data-testid="notice-popup-dismiss-checkbox"
              checked={dismiss}
              onChange={(e) => setDismiss(e.target.checked)}
            />
            오늘 하루 보지 않기
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-testid="notice-popup-close"
            onClick={handleClose}
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
