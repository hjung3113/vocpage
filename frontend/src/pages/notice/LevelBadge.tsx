import type { NoticeImportance } from '@entities/notice';

const LEVEL_LABEL: Record<NoticeImportance, string> = {
  normal: '일반',
  important: '중요',
  urgent: '긴급',
};

const LEVEL_TOKEN: Record<NoticeImportance, string> = {
  normal: 'var(--status-blue)',
  important: 'var(--status-amber)',
  urgent: 'var(--status-red)',
};

export function LevelBadge({ level }: { level: NoticeImportance }) {
  return (
    <span
      data-testid={`notice-level-badge-${level}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: '20px',
        padding: '0 8px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 600,
        background: LEVEL_TOKEN[level],
        color: 'var(--bg-elevated)',
      }}
    >
      {LEVEL_LABEL[level]}
    </span>
  );
}
