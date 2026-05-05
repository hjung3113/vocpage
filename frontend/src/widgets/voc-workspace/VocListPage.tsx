import { useMemo } from 'react';
import { useVocPageController } from '@features/voc/useVocPageController';
import { VocTopbar } from '@features/voc/components/VocTopbar';
import { VocStatusFilters } from '@features/voc/components/VocStatusFilters';
import {
  VocAdvancedFilters,
  VocAdvancedFiltersToggle,
} from '@features/voc/components/VocAdvancedFilters';
import { VocTable } from '@features/voc/components/VocTable';
import { VocPaginationBar } from '@features/voc/components/VocPaginationBar';
import { VocReviewDrawer } from '@features/voc/components/VocReviewDrawer';
import { VocCreateModal } from '@features/voc/components/VocCreateModal';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { LoadingState } from '@shared/ui/skeleton';

const SYSTEMS_PLACEHOLDER = [
  { id: '11111111-1111-4111-8111-111111111111', label: '데이터 분석' },
  { id: '22222222-2222-4222-8222-222222222222', label: '리포트' },
  { id: '33333333-3333-4333-8333-333333333333', label: '포털' },
];
const MENUS_PLACEHOLDER = [{ id: '44444444-4444-4444-8444-444444444444', label: '기본 메뉴' }];

const SYSTEMS_MAP: Record<string, string> = Object.fromEntries(
  SYSTEMS_PLACEHOLDER.map((s) => [s.id, s.label]),
);
const MENUS_MAP: Record<string, string> = Object.fromEntries(
  MENUS_PLACEHOLDER.map((m) => [m.id, m.label]),
);

export function VocListPage() {
  const ctrl = useVocPageController();
  const { list } = ctrl;
  const rows = list.data?.rows ?? [];
  const total = list.data?.total ?? 0;
  const statusValue = ctrl.filter.status ?? 'all';
  const vocTypeMap = useMemo(
    () =>
      Object.fromEntries(ctrl.masters.vocTypes.map((t) => [t.id, { slug: t.slug, name: t.name }])),
    [ctrl.masters.vocTypes],
  );

  return (
    <div className="flex flex-col">
      <VocTopbar
        totalCount={total}
        query={ctrl.filter.q ?? ''}
        onQueryChange={(q) => ctrl.setFilter({ ...ctrl.filter, q: q || undefined })}
        notifications={{
          items: ctrl.notifications.items,
          unreadCount: ctrl.notifications.unreadCount,
          onMarkAllRead: ctrl.notifications.onMarkAllRead,
          onItemClick: ctrl.notifications.onItemClick,
        }}
        onCreate={() => ctrl.create.setOpen(true)}
      />
      <VocStatusFilters
        value={statusValue}
        onChange={ctrl.onStatusChange}
        rightSlot={
          <VocAdvancedFiltersToggle open={ctrl.advanced.open} onToggle={ctrl.advanced.onToggle} />
        }
      />
      <VocAdvancedFilters
        open={ctrl.advanced.open}
        assignees={ctrl.masters.assignees}
        tags={ctrl.masters.tags}
        vocTypes={ctrl.masters.vocTypes}
        value={{
          assignees: ctrl.filter.assignees,
          priorities: ctrl.filter.priorities,
          voc_type_ids: ctrl.filter.voc_type_ids,
          tag_ids: ctrl.filter.tag_ids,
        }}
        onChange={ctrl.advanced.onChange}
        onReset={ctrl.advanced.onReset}
      />
      <div className="px-6 text-sm">
        {list.isLoading && <LoadingState data-testid="voc-loading" />}
        {list.isError && <ErrorState onRetry={() => list.refetch()} />}
        {!list.isLoading && !list.isError && rows.length === 0 && (
          <EmptyState title="VOC가 없습니다" description="필터를 조정해보세요." />
        )}
        {!list.isLoading && !list.isError && rows.length > 0 && (
          <VocTable
            rows={rows}
            sortBy={ctrl.sortBy}
            sortDir={ctrl.sortDir}
            onSort={(key) =>
              ctrl.setSort(key, ctrl.sortBy === key && ctrl.sortDir === 'desc' ? 'asc' : 'desc')
            }
            onRowClick={ctrl.drawer.open}
            assigneeMap={ctrl.masters.assigneeMap}
            vocTypeMap={vocTypeMap}
          />
        )}
      </div>
      <VocPaginationBar
        page={ctrl.page}
        perPage={ctrl.perPage}
        total={total}
        onPageChange={ctrl.setPage}
      />
      <VocReviewDrawer
        vocId={ctrl.drawer.vocId}
        notes={ctrl.notes.data}
        notesLoading={ctrl.notes.isLoading}
        pending={ctrl.pending}
        assigneeMap={ctrl.masters.assigneeMap}
        vocTypeMap={vocTypeMap}
        systemMap={SYSTEMS_MAP}
        menuMap={MENUS_MAP}
        onClose={ctrl.drawer.close}
        onAddNote={ctrl.actions.addNote}
      />
      <VocCreateModal
        open={ctrl.create.open}
        onOpenChange={ctrl.create.setOpen}
        vocTypes={ctrl.masters.vocTypes}
        systems={SYSTEMS_PLACEHOLDER}
        menus={MENUS_PLACEHOLDER}
        onSubmit={ctrl.create.onSubmit}
        submitting={ctrl.create.submitting}
      />
    </div>
  );
}
