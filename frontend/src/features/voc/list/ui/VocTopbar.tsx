import { Search, Plus } from 'lucide-react';
import { Input } from '@shared/ui/input';
import { Button } from '@shared/ui/button';
import { VocNotificationsDropdown } from '@features/voc/notification/ui/VocNotificationsDropdown';
import type { VocNotificationsDropdownProps } from '@features/voc/notification/ui/VocNotificationsDropdown';

export interface VocTopbarProps {
  totalCount: number;
  query: string;
  onQueryChange: (q: string) => void;
  notifications: VocNotificationsDropdownProps;
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
      className="flex items-center gap-3 px-5 h-10"
      style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-subtle)' }}
    >
      {/* Title + count */}
      <div className="flex items-center gap-1.5 shrink-0">
        <h1 className="text-sm font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
          전체 VOC
        </h1>
        <span
          className="text-xs font-normal"
          style={{ color: 'var(--text-muted, var(--text-quaternary))' }}
        >
          {totalCount}
        </span>
      </div>

      {/* Right-side controls */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search — compact, fixed width */}
        <div className="relative">
          <Search
            size={13}
            aria-hidden
            className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
          />
          <Input
            role="searchbox"
            aria-label="검색"
            type="search"
            placeholder="제목, 본문 검색..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="pl-7 h-7 w-56 text-xs"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border-standard)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <VocNotificationsDropdown {...notifications} />

        <Button
          type="button"
          onClick={onCreate}
          style={{ background: 'var(--brand)', color: 'var(--text-on-brand)' }}
          className="h-7 px-2.5 gap-1 text-xs font-medium"
        >
          <Plus size={13} aria-hidden />새 VOC 등록
        </Button>
      </div>
    </div>
  );
}

export default VocTopbar;
