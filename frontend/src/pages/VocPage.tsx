import { useCallback, useEffect, useState } from 'react';
import { listVocs, type VocSummary } from '../api/vocs';
import { useVOCFilter } from '../hooks/useVOCFilter';
import { useContext } from 'react';
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

export function VocPage() {
  const { filters, setFilter } = useVOCFilter();
  const { openDrawer, closeDrawer, selectedVocId, isOpen } = useVOCDrawer();

  const [vocs, setVocs] = useState<VocSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<'created_at' | 'due_date' | 'priority' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
    setIsLoading(true);
    try {
      const result = await listVocs({
        status: filters.status ?? undefined,
        priority: filters.priority ?? undefined,
        keyword: filters.keyword || undefined,
        assignee_id: filters.assigneeId ?? undefined,
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
    page,
    sortColumn,
    sortOrder,
  ]);

  useEffect(() => {
    void fetchVocs();
  }, [fetchVocs]);

  // Reset page when filters change
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

  const handleReset = useCallback(() => {
    setFilter('priority', null);
    setFilter('tagId', null);
    setFilter('assigneeId', null);
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
