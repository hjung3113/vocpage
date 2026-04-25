import { useState } from 'react';
import type { Notice } from '../../api/notices';

export interface NoticePopupProps {
  notices: Notice[];
  onClose: () => void;
}

function getTodayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function dismissStorageKey(id: string): string {
  return `notice_dismiss_${id}_${getTodayKey()}`;
}

function LevelBadge({ level }: { level: Notice['level'] }) {
  const labelMap: Record<Notice['level'], string> = {
    normal: '일반',
    important: '중요',
    urgent: '긴급',
  };
  const colorMap: Record<Notice['level'], string> = {
    normal: 'var(--text-muted)',
    important: 'var(--accent)',
    urgent: 'var(--danger)',
  };
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        color: colorMap[level],
        border: `1px solid ${colorMap[level]}`,
        borderRadius: '4px',
        padding: '1px 5px',
        marginRight: '6px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {labelMap[level]}
    </span>
  );
}

export function NoticePopup({ notices, onClose }: NoticePopupProps) {
  const levelOrder: Record<Notice['level'], number> = {
    urgent: 0,
    important: 1,
    normal: 2,
  };
  const sorted = [...notices].sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

  const [selectedId, setSelectedId] = useState<string>(sorted[0]?.id ?? '');
  const [dismissAll, setDismissAll] = useState(false);

  if (notices.length === 0) return null;

  const selected = sorted.find((n) => n.id === selectedId) ?? sorted[0];

  const handleClose = () => {
    if (dismissAll) {
      sorted.forEach((n) => {
        localStorage.setItem(dismissStorageKey(n.id), '1');
      });
    }
    onClose();
  };

  const handleDismissChange = (checked: boolean) => {
    setDismissAll(checked);
  };

  // Single notice modal
  if (sorted.length === 1) {
    const notice = sorted[0];
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--overlay-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      >
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            width: '480px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <LevelBadge level={notice.level} />
            <span
              style={{
                flex: 1,
                fontWeight: 600,
                fontSize: '15px',
                color: 'var(--text-primary)',
              }}
            >
              {notice.title}
            </span>
          </div>

          {/* Body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
            }}
            dangerouslySetInnerHTML={{ __html: notice.body }}
          />

          {/* Footer */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={dismissAll}
                onChange={(e) => handleDismissChange(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              오늘 하루 보지 않기
            </label>
            <button
              onClick={handleClose}
              style={{
                background: 'var(--brand)',
                color: 'var(--text-on-brand)',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Multi notice modal (2-panel)
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          width: '720px',
          maxWidth: '95vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            fontWeight: 600,
            fontSize: '15px',
            color: 'var(--text-primary)',
          }}
        >
          공지사항
        </div>

        {/* Two-panel body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: list */}
          <div
            style={{
              width: '240px',
              flexShrink: 0,
              borderRight: '1px solid var(--border)',
              overflowY: 'auto',
              padding: '8px 0',
            }}
          >
            {sorted.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedId(n.id)}
                style={{
                  width: '100%',
                  background: n.id === selectedId ? 'var(--bg-surface)' : 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderLeft:
                    n.id === selectedId ? '2px solid var(--brand)' : '2px solid transparent',
                }}
              >
                <LevelBadge level={n.level} />
                <span
                  style={{
                    fontSize: '13px',
                    color: n.id === selectedId ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: n.id === selectedId ? 500 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {n.title}
                </span>
              </button>
            ))}
          </div>

          {/* Right: content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              fontSize: '14px',
              lineHeight: '1.6',
              color: 'var(--text-secondary)',
            }}
            dangerouslySetInnerHTML={{ __html: selected.body }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={dismissAll}
              onChange={(e) => handleDismissChange(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            오늘 하루 보지 않기
          </label>
          <button
            onClick={handleClose}
            style={{
              background: 'var(--brand)',
              color: 'var(--text-on-brand)',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
