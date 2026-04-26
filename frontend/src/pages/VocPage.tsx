import { useCallback, useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { listVocs, type VocSummary } from '../api/vocs';
import { useVOCFilter } from '../hooks/useVOCFilter';
import { VOCDrawerContext } from '../contexts/VOCDrawerContext';
import { VocTopbar } from '../components/voc/VocTopbar';
import { VocFilterBar } from '../components/voc/VocFilterBar';
import { VocList } from '../components/voc/VocList';
import { VocDrawer } from '../components/voc/VocDrawer';
import { VocCreateModal } from '../components/voc/VocCreateModal';
import type { VocStatus } from '../contexts/VOCFilterContext';

function useVOCDrawer() {
  const ctx = useContext(VOCDrawerContext);
  if (!ctx) throw new Error('useVOCDrawer must be used within VOCDrawerProvider');
  return ctx;
}

const LIMIT = 20;

const VIEW_TITLE: Record<string, string> = {
  mine: '내 VOC',
  assigned: '담당 VOC',
};

export function VocPage() {
  const { filters, setFilter, resetFilters } = useVOCFilter();
  const { openDrawer, closeDrawer, selectedVocId, isOpen } = useVOCDrawer();
  const location = useLocation();

  const [vocs, setVocs] = useState<VocSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<'created_at' | 'due_date' | 'priority' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageTitle, setPageTitle] = useState('전체 VOC');

  // Sync URL params → title + reset filter bar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    const systemId = params.get('system_id');
    const menuId = params.get('menu_id');

    resetFilters();
    setPage(1);

    if (view) {
      setPageTitle(VIEW_TITLE[view] ?? '전체 VOC');
    } else if (systemId) {
      fetch('/api/systems', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: Array<{ id: string; name: string }>) => {
          const systemName = data.find((s) => s.id === systemId)?.name ?? systemId;
          if (menuId) {
            fetch(`/api/systems/${systemId}/menus`, { credentials: 'include' })
              .then((r) => (r.ok ? r.json() : []))
              .then((menus: Array<{ id: string; name: string }>) => {
                const menuName = menus.find((m) => m.id === menuId)?.name ?? menuId;
                setPageTitle(`${systemName} / ${menuName}`);
              })
              .catch(() => setPageTitle(systemName));
          } else {
            setPageTitle(systemName);
          }
        })
        .catch(() => setPageTitle('전체 VOC'));
    } else {
      setPageTitle('전체 VOC');
    }
  }, [location.search, resetFilters]);

  const handleSort = useCallback(
    (column: string) => {
      const col = column as 'created_at' | 'due_date' | 'priority';
      if (col === sortColumn) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortColumn(col);
        setSortOrder('desc');
      }
    },
    [sortColumn],
  );

  const fetchVocs = useCallback(async () => {
    const params = new URLSearchParams(location.search);
    const view = params.get('view') ?? undefined;
    const systemId = params.get('system_id') ?? undefined;
    const menuId = params.get('menu_id') ?? undefined;

    setIsLoading(true);
    try {
      const result = await listVocs({
        status: filters.status ?? undefined,
        priority: filters.priority ?? undefined,
        keyword: filters.keyword || undefined,
        // view 모드(mine/assigned)는 독립 필터 — 필터바 assigneeId와 합산하지 않음
        assignee_id: view ? undefined : (filters.assigneeId ?? undefined),
        view,
        system_id: systemId,
        menu_id: menuId,
        page,
        limit: LIMIT,
        sort: sortColumn ?? undefined,
        order: sortColumn ? sortOrder : undefined,
      });
      setVocs(result.data);
      setTotal(result.total);
    } catch {
      // silently handle error — production error handling in future phase
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.status,
    filters.priority,
    filters.keyword,
    filters.assigneeId,
    location.search,
    page,
    sortColumn,
    sortOrder,
  ]);

  useEffect(() => {
    void fetchVocs();
  }, [fetchVocs]);

  // Reset page when filter bar changes
  useEffect(() => {
    setPage(1);
  }, [filters.status, filters.priority, filters.keyword, filters.assigneeId]);

  const handleSearch = useCallback(
    (keyword: string) => {
      setFilter('keyword', keyword);
    },
    [setFilter],
  );

  const handleStatusChange = useCallback(
    (status: VocStatus | null) => {
      setFilter('status', status);
    },
    [setFilter],
  );

  const handleTagChange = useCallback(
    (tagId: string | null) => {
      setFilter('tagId', tagId);
    },
    [setFilter],
  );

  const handleAssigneeChange = useCallback(
    (assigneeId: string | null) => {
      setFilter('assigneeId', assigneeId);
    },
    [setFilter],
  );

  const handlePriorityChange = useCallback(
    (priority: string | null) => {
      setFilter('priority', priority);
    },
    [setFilter],
  );

  const handleVocTypeChange = useCallback(
    (vocType: string | null) => {
      setFilter('vocType', vocType);
    },
    [setFilter],
  );

  const handleReset = useCallback(() => {
    setFilter('priority', null);
    setFilter('tagId', null);
    setFilter('assigneeId', null);
    setFilter('vocType', null);
  }, [setFilter]);

  const handleCreated = useCallback(() => {
    void fetchVocs();
  }, [fetchVocs]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        background: 'var(--bg-app)',
        overflow: 'hidden',
      }}
    >
      <VocTopbar
        total={total}
        onSearch={handleSearch}
        onCreateClick={() => setCreateModalOpen(true)}
        title={pageTitle}
      />
      <VocFilterBar
        activeStatus={filters.status}
        onStatusChange={handleStatusChange}
        activeTagId={filters.tagId}
        onTagChange={handleTagChange}
        activeAssigneeId={filters.assigneeId}
        onAssigneeChange={handleAssigneeChange}
        activePriority={filters.priority}
        onPriorityChange={handlePriorityChange}
        activeVocType={filters.vocType}
        onVocTypeChange={handleVocTypeChange}
        onReset={handleReset}
      />
      <VocList
        vocs={vocs}
        total={total}
        page={page}
        limit={LIMIT}
        onPageChange={setPage}
        onVocClick={openDrawer}
        isLoading={isLoading}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
      <VocDrawer vocId={selectedVocId} isOpen={isOpen} onClose={closeDrawer} />
      <VocCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
