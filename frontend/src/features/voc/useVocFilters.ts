import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  VocStatus,
  VocPriority,
  VocSortColumn,
  SortDir,
  type VocFilter,
  type VocSortColumn as VocSortColumnT,
  type SortDir as SortDirT,
  type VocPriority as VocPriorityT,
} from '../../../../shared/contracts/voc';

export interface VocPageFilters {
  filter: VocFilter;
  sortBy: VocSortColumnT;
  sortDir: SortDirT;
  page: number;
  perPage: number;
}

const DEFAULT_PER_PAGE = 20;

/** URL ↔ VocFilter+sort+page sync. Multi-status round-trips via repeated keys. */
export function useVocFilters(): {
  state: VocPageFilters;
  setFilter: (next: VocFilter) => void;
  setSort: (sortBy: VocSortColumnT, sortDir: SortDirT) => void;
  setPage: (page: number) => void;
  vocId: string | null;
  setVocId: (id: string | null) => void;
} {
  const [params, setParams] = useSearchParams();

  const state = useMemo<VocPageFilters>(() => {
    const status = params
      .getAll('status')
      .filter((s): s is import('../../../../shared/contracts/voc').VocStatus =>
        VocStatus.options.includes(s as never),
      );
    const priorities = params
      .getAll('priorities')
      .filter((p): p is VocPriorityT => VocPriority.options.includes(p as never));
    const filter: VocFilter = {
      status: status.length ? status : undefined,
      system_id: params.get('system_id') ?? undefined,
      assignees: params.getAll('assignees').length ? params.getAll('assignees') : undefined,
      priorities: priorities.length ? priorities : undefined,
      voc_type_ids: params.getAll('voc_type_ids').length
        ? params.getAll('voc_type_ids')
        : undefined,
      tag_ids: params.getAll('tag_ids').length ? params.getAll('tag_ids') : undefined,
      q: params.get('q') ?? undefined,
    };
    const sortByRaw = params.get('sort_by');
    const sortDirRaw = params.get('sort_dir');
    const sortBy: VocSortColumnT = VocSortColumn.options.includes(sortByRaw as never)
      ? (sortByRaw as VocSortColumnT)
      : 'created_at';
    const sortDir: SortDirT = SortDir.options.includes(sortDirRaw as never)
      ? (sortDirRaw as SortDirT)
      : 'desc';
    const pageRaw = Number(params.get('page'));
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const perPageRaw = Number(params.get('per_page'));
    const perPage = Number.isFinite(perPageRaw) && perPageRaw > 0 ? perPageRaw : DEFAULT_PER_PAGE;
    return { filter, sortBy, sortDir, page, perPage };
  }, [params]);

  const buildParams = useCallback(
    (next: VocPageFilters): URLSearchParams => {
      const p = new URLSearchParams();
      const { filter, sortBy, sortDir, page, perPage } = next;
      if (filter.status) for (const s of filter.status) p.append('status', s);
      if (filter.system_id) p.set('system_id', filter.system_id);
      if (filter.assignees) for (const a of filter.assignees) p.append('assignees', a);
      if (filter.priorities) for (const pr of filter.priorities) p.append('priorities', pr);
      if (filter.voc_type_ids) for (const t of filter.voc_type_ids) p.append('voc_type_ids', t);
      if (filter.tag_ids) for (const t of filter.tag_ids) p.append('tag_ids', t);
      if (filter.q) p.set('q', filter.q);
      if (sortBy !== 'created_at') p.set('sort_by', sortBy);
      if (sortDir !== 'desc') p.set('sort_dir', sortDir);
      if (page !== 1) p.set('page', String(page));
      if (perPage !== DEFAULT_PER_PAGE) p.set('per_page', String(perPage));
      const id = params.get('id');
      if (id) p.set('id', id);
      return p;
    },
    [params],
  );

  const setFilter = useCallback(
    (next: VocFilter) => {
      setParams(buildParams({ ...state, filter: next, page: 1 }), { replace: true });
    },
    [state, buildParams, setParams],
  );

  const setSort = useCallback(
    (sortBy: VocSortColumnT, sortDir: SortDirT) => {
      setParams(buildParams({ ...state, sortBy, sortDir, page: 1 }), { replace: true });
    },
    [state, buildParams, setParams],
  );

  const setPage = useCallback(
    (page: number) => {
      setParams(buildParams({ ...state, page }), { replace: true });
    },
    [state, buildParams, setParams],
  );

  const vocId = params.get('id');
  const setVocId = useCallback(
    (id: string | null) => {
      const p = new URLSearchParams(params);
      if (id) p.set('id', id);
      else p.delete('id');
      setParams(p, { replace: true });
    },
    [params, setParams],
  );

  return { state, setFilter, setSort, setPage, vocId, setVocId };
}
