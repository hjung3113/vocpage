import { useCallback, useRef } from 'react';
import { NotificationBell } from '../common/NotificationBell';
import { useMasterCache } from '../../hooks/useMasterCache';
import { useAuth } from '../../hooks/useAuth';

interface VocTopbarProps {
  total: number;
  onSearch: (keyword: string) => void;
  onCreateClick: () => void;
}

export function VocTopbar({ total, onSearch, onCreateClick }: VocTopbarProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();
  const { isColdStartMode, isSnapshotMode } = useMasterCache();
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearch(e.target.value);
        timerRef.current = null;
      }, 300);
    },
    [onSearch],
  );

  return (
    <header
      className="flex items-center gap-4 px-6 py-3 shrink-0"
      style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}
    >
      {/* Left: title + count + master mode badge */}
      <div className="flex items-center gap-2 shrink-0">
        <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          VOC 목록
        </h1>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
        >
          {total}
        </span>
        {isManagerOrAdmin && isColdStartMode && (
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--status-amber-bg)',
              border: '1px solid var(--status-amber-border)',
              color: 'var(--text-primary)',
            }}
          >
            콜드 스타트 모드
          </span>
        )}
        {isManagerOrAdmin && !isColdStartMode && isSnapshotMode && (
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--status-amber-bg)',
              border: '1px solid var(--status-amber-border)',
              color: 'var(--text-primary)',
            }}
          >
            스냅샷 모드
          </span>
        )}
      </div>

      {/* Center: search */}
      <div className="flex-1 flex justify-center">
        <input
          type="search"
          placeholder="검색..."
          onChange={handleInputChange}
          className="w-full max-w-sm px-3 py-1.5 rounded text-sm"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          }}
        />
      </div>

      {/* Right: notification + create */}
      <div className="flex items-center gap-2 shrink-0">
        <NotificationBell />
        <button
          onClick={onCreateClick}
          className="px-4 py-1.5 rounded text-sm font-medium"
          style={{ background: 'var(--brand)', color: 'var(--text-on-brand)' }}
        >
          새 VOC 등록
        </button>
      </div>
    </header>
  );
}
