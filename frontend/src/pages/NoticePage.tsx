import { useCallback, useContext, useEffect, useState } from 'react';
import { listNotices, toggleNoticeVisibility, deleteNotice, type Notice } from '../api/notices';
import { AuthContext } from '../contexts/AuthContext';

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
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
        padding: '1px 6px',
        marginRight: '8px',
        whiteSpace: 'nowrap',
      }}
    >
      {labelMap[level]}
    </span>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function NoticePage() {
  const { user } = useAuth();
  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const [notices, setNotices] = useState<Notice[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listNotices();
      setNotices(data);
    } catch {
      // silently handle
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotices();
  }, [fetchNotices]);

  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleToggleVisibility = async (notice: Notice) => {
    try {
      const updated = await toggleNoticeVisibility(notice.id, !notice.is_visible);
      setNotices((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch {
      // silently handle
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('공지사항을 삭제하시겠습니까?')) return;
    try {
      await deleteNotice(id);
      setNotices((prev) => prev.filter((n) => n.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      // silently handle
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
        padding: '32px 24px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '24px',
          color: 'var(--text-primary)',
        }}
      >
        공지사항
      </h1>

      {isLoading && <p style={{ color: 'var(--text-muted)' }}>불러오는 중...</p>}

      {!isLoading && notices.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>공지사항이 없습니다.</p>
      )}

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {notices.map((notice) => (
          <li
            key={notice.id}
            style={{
              borderBottom: '1px solid var(--border)',
              paddingBottom: '0',
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 0',
                gap: '8px',
              }}
            >
              <LevelBadge level={notice.level} />

              <button
                onClick={() => handleToggleExpand(notice.id)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: notice.is_visible ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                {notice.title}
              </button>

              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  marginLeft: '8px',
                }}
              >
                {formatDate(notice.created_at)}
              </span>

              {isManager && (
                <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                  <button
                    onClick={() => void handleToggleVisibility(notice)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: notice.is_visible ? 'var(--accent)' : 'var(--text-muted)',
                    }}
                  >
                    {notice.is_visible ? '공개' : '비공개'}
                  </button>
                  <button
                    onClick={() => void handleDelete(notice.id)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--danger)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      color: 'var(--danger)',
                    }}
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>

            {/* Expanded body */}
            {expandedId === notice.id && (
              <div
                style={{
                  padding: '16px',
                  marginBottom: '8px',
                  background: 'var(--bg-panel)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
                dangerouslySetInnerHTML={{ __html: notice.body }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
