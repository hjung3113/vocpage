import { Button } from '@shared/ui/button';
import type { Notice } from '@entities/notice';
import { LevelBadge } from './LevelBadge';

interface Props {
  notice: Notice;
  expanded: boolean;
  onToggle: () => void;
  isAdminMode: boolean;
  isAdmin: boolean;
  onEdit: (n: Notice) => void;
  onDelete: (n: Notice) => void;
  onRestore: (n: Notice) => void;
  onToggleVisible: (n: Notice, next: boolean) => void;
}

export function NoticeRow({
  notice,
  expanded,
  onToggle,
  isAdminMode,
  isAdmin,
  onEdit,
  onDelete,
  onRestore,
  onToggleVisible,
}: Props) {
  const isDeleted = notice.deleted_at !== null;
  return (
    <li
      data-testid={`notice-row-${notice.id}`}
      className="border-b border-[color:var(--border-standard)] py-3"
    >
      <div className="flex items-center gap-3">
        <LevelBadge level={notice.level} />
        <button
          type="button"
          data-testid={`notice-title-${notice.id}`}
          onClick={onToggle}
          className="flex-1 text-left text-sm font-medium text-[color:var(--text-primary)] hover:underline"
        >
          {notice.title}
        </button>
        {isAdminMode ? (
          <>
            <label className="flex items-center gap-1 text-xs text-[color:var(--text-secondary)]">
              <input
                type="checkbox"
                data-testid={`notice-toggle-${notice.id}`}
                checked={notice.is_visible}
                onChange={(e) => onToggleVisible(notice, e.target.checked)}
              />
              노출
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-testid={`notice-edit-${notice.id}`}
              onClick={() => onEdit(notice)}
            >
              수정
            </Button>
            {isDeleted ? (
              isAdmin ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  data-testid={`notice-restore-${notice.id}`}
                  onClick={() => onRestore(notice)}
                >
                  복원
                </Button>
              ) : null
            ) : (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                data-testid={`notice-delete-${notice.id}`}
                onClick={() => onDelete(notice)}
              >
                삭제
              </Button>
            )}
          </>
        ) : null}
      </div>
      {expanded ? (
        <div
          data-testid={`notice-body-${notice.id}`}
          className="mt-2 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-surface)] p-3 text-sm text-[color:var(--text-primary)]"
          // TODO(security): wrap with DOMPurify once available; BE는 Toast UI Editor의
          // 화이트리스트 산출물만 저장하지만, FE-side 추가 sanitize 필요.
          dangerouslySetInnerHTML={{ __html: notice.body }}
        />
      ) : null}
    </li>
  );
}
