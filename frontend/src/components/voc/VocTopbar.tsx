import { useCallback, useRef } from 'react';
import { Search, Plus } from 'lucide-react';
import { NotificationBell } from '../common/NotificationBell';
import { useMasterCache } from '../../hooks/useMasterCache';
import { useAuth } from '../../hooks/useAuth';

interface VocTopbarProps {
  total: number;
  onSearch: (keyword: string) => void;
  onCreateClick: () => void;
  title?: string;
}

export function VocTopbar({ total, onSearch, onCreateClick, title = '전체 VOC' }: VocTopbarProps) {
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
      className="flex items-center gap-3 px-6 shrink-0"
      style={{
        height: '56px',
        background: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Left: title + count + mode badges */}
      <div className="flex items-center gap-2 shrink-0">
        <h1
          className="text-base font-semibold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
        >
          {title}
        </h1>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-tertiary)',
            border: '1px solid var(--border-standard)',
          }}
        >
          {total}개
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
            콜드 스타트
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

      {/* Right: search + notification + create */}
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <div style={{ position: 'relative' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-quaternary)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="search"
            placeholder="제목, 본문 검색..."
            onChange={handleInputChange}
            style={{
              width: '220px',
              paddingLeft: '30px',
              paddingRight: '10px',
              paddingTop: '6px',
              paddingBottom: '6px',
              borderRadius: '7px',
              fontSize: '13px',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-standard)',
              outline: 'none',
            }}
          />
        </div>

        <NotificationBell />

        <button
          onClick={onCreateClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
          style={{
            background: 'var(--brand)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '-0.01em',
          }}
        >
          <Plus size={14} />새 VOC 등록
        </button>
      </div>
    </header>
  );
}
