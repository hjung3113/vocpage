import { useEffect, useState } from 'react';
import { getVoc, type VocDetail } from '../../api/vocs';
import { useAuth } from '../../hooks/useAuth';
import { StatusDot } from '../common/StatusDot';
import { PriorityBadge } from '../common/PriorityBadge';
import { CommentList } from './CommentList';
import { AttachmentList } from './AttachmentList';
import { InternalNotesSection } from './InternalNotesSection';

interface VocDrawerProps {
  vocId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'body' | 'comments' | 'attachments';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function VocDrawer({ vocId, isOpen, onClose }: VocDrawerProps) {
  const { user } = useAuth();
  const [voc, setVoc] = useState<VocDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('body');

  useEffect(() => {
    if (!vocId) {
      setVoc(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setActiveTab('body');
    getVoc(vocId)
      .then(setVoc)
      .catch(() => setError('VOC를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, [vocId]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'body', label: '본문' },
    { key: 'comments', label: '댓글' },
    { key: 'attachments', label: '첨부파일' },
  ];

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

              {/* Tabs */}
              <div
                className="flex gap-0 mb-4 shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="px-4 py-2 text-sm font-medium"
                    style={{
                      color: activeTab === tab.key ? 'var(--brand)' : 'var(--text-secondary)',
                      background: 'transparent',
                      border: 'none',
                      borderBottom:
                        activeTab === tab.key ? '2px solid var(--brand)' : '2px solid transparent',
                      cursor: 'pointer',
                      marginBottom: '-1px',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'body' && (
                <div>
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
              )}

              {activeTab === 'comments' && user && (
                <CommentList vocId={voc.id} currentUserId={user.id} currentUserRole={user.role} />
              )}

              {activeTab === 'attachments' && user && (
                <AttachmentList
                  vocId={voc.id}
                  currentUserId={user.id}
                  currentUserRole={user.role}
                />
              )}

              {/* Internal notes — always shown below tabs for manager/admin */}
              {user && (
                <InternalNotesSection
                  vocId={voc.id}
                  currentUserId={user.id}
                  currentUserRole={user.role}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
