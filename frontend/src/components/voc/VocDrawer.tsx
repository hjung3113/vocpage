import { useEffect, useState } from 'react';
import { getVoc, type VocDetail } from '../../api/vocs';
import { StatusDot } from '../common/StatusDot';
import { PriorityBadge } from '../common/PriorityBadge';

interface VocDrawerProps {
  vocId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function VocDrawer({ vocId, isOpen, onClose }: VocDrawerProps) {
  const [voc, setVoc] = useState<VocDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vocId) {
      setVoc(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    getVoc(vocId)
      .then(setVoc)
      .catch(() => setError('VOC를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, [vocId]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--overlay-bg)',
            zIndex: 40,
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: '480px',
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
            {voc && (
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {voc.issue_code ?? '—'}
              </span>
            )}
            <h2
              className="text-base font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {isLoading ? '불러오는 중...' : (voc?.title ?? '—')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 px-2 py-1 rounded text-sm"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {error && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          {!isLoading && voc && (
            <>
              {/* Meta section */}
              <div
                className="flex flex-col gap-3 mb-6 p-4 rounded-lg"
                style={{ background: 'var(--bg-surface)' }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: 'var(--text-muted)', width: '64px', flexShrink: 0 }}>
                    상태
                  </span>
                  <div className="flex items-center gap-2">
                    <StatusDot status={voc.status} />
                    <span style={{ color: 'var(--text-primary)' }}>{voc.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: 'var(--text-muted)', width: '64px', flexShrink: 0 }}>
                    우선순위
                  </span>
                  <PriorityBadge priority={voc.priority} />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: 'var(--text-muted)', width: '64px', flexShrink: 0 }}>
                    등록일
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(voc.created_at)}
                  </span>
                </div>
                {voc.due_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <span style={{ color: 'var(--text-muted)', width: '64px', flexShrink: 0 }}>
                      기한
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(voc.due_date)}
                    </span>
                  </div>
                )}
              </div>

              {/* Body */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  내용
                </p>
                <pre
                  className="text-sm whitespace-pre-wrap break-words"
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    lineHeight: '1.6',
                  }}
                >
                  {voc.body}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
