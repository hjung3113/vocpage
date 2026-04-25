import { useCallback, useRef } from 'react';

interface VocTopbarProps {
  total: number;
  onSearch: (keyword: string) => void;
  onCreateClick: () => void;
}

export function VocTopbar({ total, onSearch, onCreateClick }: VocTopbarProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      {/* Left: title + count */}
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
        <button
          className="px-3 py-1.5 rounded text-sm"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          aria-label="알림"
        >
          🔔
        </button>
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
