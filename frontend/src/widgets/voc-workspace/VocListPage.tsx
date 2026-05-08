import { useCallback, useMemo, useState } from 'react';
import type { VocStatus } from '@contracts/voc';
import { useLocalStorageState } from '@shared/hooks/useLocalStorageState';
import { useVocPageController } from '@features/voc/model/useVocPageController';
import { VocTopbar } from '@features/voc/list/ui/VocTopbar';
import { VocStatusFilters } from '@features/voc/list/ui/VocStatusFilters';
import {
  VocAdvancedFilters,
  VocAdvancedFiltersToggle,
} from '@features/voc/list/ui/VocAdvancedFilters';
import { VocTable } from '@features/voc/list/ui/VocTable';
import { VocPaginationBar } from '@features/voc/list/ui/VocPaginationBar';
import { VocSidePanel } from './VocSidePanel';
import { VocCreateDialog } from '@features/voc/create/ui/VocCreateDialog';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { LoadingState } from '@shared/ui/skeleton';

const SYSTEMS_PLACEHOLDER = [
  { id: '11111111-1111-4111-8111-111111111111', label: '데이터 분석' },
  { id: '22222222-2222-4222-8222-222222222222', label: '리포트' },
  { id: '33333333-3333-4333-8333-333333333333', label: '포털' },
];
const MENUS_PLACEHOLDER = [
  {
    id: '44444444-4444-4444-8444-444444444444',
    system_id: SYSTEMS_PLACEHOLDER[0]!.id,
    name: '기본 메뉴',
    slug: 'default',
    is_archived: false,
  },
];

const SYSTEMS_MAP: Record<string, string> = Object.fromEntries(
  SYSTEMS_PLACEHOLDER.map((s) => [s.id, s.label]),
);
const MENUS_MAP: Record<string, string> = Object.fromEntries(
  MENUS_PLACEHOLDER.map((m) => [m.id, m.name]),
);

export function VocListPage() {
  const ctrl = useVocPageController();
  const { list } = ctrl;
  const rows = list.data?.rows ?? [];
  const total = list.data?.total ?? 0;
  const statusValue = ctrl.filter.status ?? 'all';
  const selectedRow = rows.find((r) => r.id === ctrl.drawer.vocId);
  const [isPanelFullscreen, setIsPanelFullscreen] = useState(false);

  // Phase 5: status별 collapsible 그루핑. localStorage 영속.
  const [collapsedList, setCollapsedList] = useLocalStorageState<VocStatus[]>(
    'voc-list-group-collapsed',
    [],
  );
  const collapsedStatuses = useMemo(() => new Set<VocStatus>(collapsedList), [collapsedList]);
  const toggleStatus = useCallback(
    (status: VocStatus) => {
      setCollapsedList((prev) =>
        prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
      );
    },
    [setCollapsedList],
  );

  const vocTypeMap = useMemo(
    () =>
      Object.fromEntries(ctrl.masters.vocTypes.map((t) => [t.id, { slug: t.slug, name: t.name }])),
    [ctrl.masters.vocTypes],
  );

  // Side panel is open only when reviewing
  const panelOpen = !!ctrl.drawer.vocId;

  return (
    <div className="flex flex-col" style={{ height: '100%' }}>
      {/* Topbar + Filters — hidden in fullscreen panel mode */}
      {!isPanelFullscreen && (
        <>
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
            onCreate={() => {
              ctrl.drawer.close();
              ctrl.create.setOpen(true);
            }}
          />
          <VocStatusFilters
            value={statusValue}
            onChange={ctrl.onStatusChange}
            rightSlot={
              <VocAdvancedFiltersToggle
                open={ctrl.advanced.open}
                onToggle={ctrl.advanced.onToggle}
              />
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
        </>
      )}

      {/* Main content area: list + panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: list (hidden when panel is fullscreen) */}
        {!isPanelFullscreen && (
          <div className="flex flex-col flex-1 overflow-auto min-w-0">
            <div className="flex-1">
              {list.isLoading && (
                <div className="px-6">
                  <LoadingState data-testid="voc-loading" />
                </div>
              )}
              {list.isError && (
                <div className="px-6">
                  <ErrorState onRetry={() => list.refetch()} />
                </div>
              )}
              {!list.isLoading && !list.isError && rows.length === 0 && (
                <div className="px-6">
                  <EmptyState title="VOC가 없습니다" description="필터를 조정해보세요." />
                </div>
              )}
              {!list.isLoading && !list.isError && rows.length > 0 && (
                <VocTable
                  rows={rows}
                  sortBy={ctrl.sortBy}
                  sortDir={ctrl.sortDir}
                  onSort={(key) =>
                    ctrl.setSort(
                      key,
                      ctrl.sortBy === key && ctrl.sortDir === 'desc' ? 'asc' : 'desc',
                    )
                  }
                  onRowClick={(id) => {
                    ctrl.create.setOpen(false);
                    ctrl.drawer.open(id);
                  }}
                  selectedId={ctrl.drawer.vocId}
                  assigneeMap={ctrl.masters.assigneeMap}
                  vocTypeMap={vocTypeMap}
                  groupByStatus
                  collapsedStatuses={collapsedStatuses}
                  onToggleStatus={toggleStatus}
                />
              )}
            </div>
            <VocPaginationBar
              page={ctrl.page}
              perPage={ctrl.perPage}
              total={total}
              onPageChange={ctrl.setPage}
            />
          </div>
        )}

        {/* Right: side panel (review only) */}
        {panelOpen && ctrl.drawer.vocId && (
          <VocSidePanel
            review={{
              vocId: ctrl.drawer.vocId,
              tags: selectedRow?.tags,
              notes: ctrl.notes.data,
              notesLoading: ctrl.notes.isLoading,
              pending: ctrl.pending,
              assigneeMap: ctrl.masters.assigneeMap,
              vocTypeMap,
              systemMap: SYSTEMS_MAP,
              menuMap: MENUS_MAP,
              onClose: ctrl.drawer.close,
              onAddNote: ctrl.actions.addNote,
            }}
            isFullscreen={isPanelFullscreen}
            onToggleFullscreen={() => setIsPanelFullscreen((v) => !v)}
          />
        )}
      </div>

      {/* Create dialog (modal) */}
      <VocCreateDialog
        open={ctrl.create.open}
        onOpenChange={(v) => {
          if (!v) ctrl.create.setOpen(false);
        }}
        vocTypes={ctrl.masters.vocTypes}
        systems={SYSTEMS_PLACEHOLDER}
        menus={MENUS_PLACEHOLDER}
        assignees={Object.entries(ctrl.masters.assigneeMap).map(([id, label]) => ({ id, label }))}
        onSubmit={ctrl.create.onSubmit}
        submitting={ctrl.create.submitting}
      />
    </div>
  );
}
