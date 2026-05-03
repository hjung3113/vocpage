import { Search, Plus } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { NotificationBell } from '../../../components/common/NotificationBell';
import type { NotificationBellProps } from '../../../components/common/NotificationBell';

export interface VocTopbarProps {
  totalCount: number;
  query: string;
  onQueryChange: (q: string) => void;
  notifications: NotificationBellProps;
  onCreate: () => void;
}

export function VocTopbar({
  totalCount,
  query,
  onQueryChange,
  notifications,
  onCreate,
}: VocTopbarProps) {
  return (
    <div
      data-pcomp="voc-topbar"
      className="flex items-center gap-2 px-6 h-14"
      style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}
    >
      {/* Title + badge */}
      <div className="flex items-center gap-2 shrink-0">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          전체 VOC
        </h1>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: 'var(--brand)', color: 'var(--text-on-brand)' }}
        >
          {totalCount}개
        </span>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search
          size={15}
          aria-hidden
          className="absolute left-2.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-secondary)' }}
        />
        <Input
          role="searchbox"
          aria-label="검색"
          type="search"
          placeholder="제목, 본문 검색..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="pl-8"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-standard)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell {...notifications} />
        <Button
          type="button"
          onClick={onCreate}
          style={{ background: 'var(--brand)', color: 'var(--text-on-brand)' }}
          className="gap-1.5"
        >
          <Plus size={16} aria-hidden />새 VOC 등록
        </Button>
      </div>
    </div>
  );
}

export default VocTopbar;
