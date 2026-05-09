/**
 * VOC list page top bar — composes <PageHeader> with VOC-specific actions.
 * Spec: docs/specs/requires/uidesign.md §5 Page Header → Slot contract.
 *
 * Header height, title typography, count format, and action sizing are owned
 * by <PageHeader> + the .page-header-actions cascade. This file only wires
 * VOC-specific affordances (search, notification dropdown, "+새 VOC 등록").
 */
import { Search, Plus } from 'lucide-react';
import { Input } from '@shared/ui/input';
import { Button } from '@shared/ui/button';
import { PageHeader } from '@widgets/app-shell';
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
    <div data-testid="voc-topbar">
      <PageHeader
        title="전체 VOC"
        count={totalCount}
        actions={
          <>
            <div className="relative" style={{ width: 'var(--page-header-search-w)' }}>
              <Search
                size={14}
                aria-hidden
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
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
              />
            </div>
            <span role="separator" data-gap="loose" />
            <VocNotificationsDropdown {...notifications} />
            <span role="separator" data-gap="loose" />
            <Button type="button" onClick={onCreate} className="gap-1">
              <Plus size={14} aria-hidden />새 VOC 등록
            </Button>
          </>
        }
      />
    </div>
  );
}

export default VocTopbar;
