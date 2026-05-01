import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VocStatus, type VocFilter } from '../../../../shared/contracts/voc';

/** URL ↔ VocFilter sync. Multi-status round-trips via repeated `?status=...` keys. */
export function useVocFilters(): {
  filter: VocFilter;
  setFilter: (next: VocFilter) => void;
  vocId: string | null;
  setVocId: (id: string | null) => void;
} {
  const [params, setParams] = useSearchParams();

  const filter = useMemo<VocFilter>(() => {
    const status = params
      .getAll('status')
      .filter((s): s is import('../../../../shared/contracts/voc').VocStatus =>
        VocStatus.options.includes(s as never),
      );
    return {
      status: status.length ? status : undefined,
      system_id: params.get('system_id') ?? undefined,
      assignees: params.getAll('assignees').length ? params.getAll('assignees') : undefined,
      q: params.get('q') ?? undefined,
    };
  }, [params]);

  const setFilter = useCallback(
    (next: VocFilter) => {
      const p = new URLSearchParams();
      if (next.status) for (const s of next.status) p.append('status', s);
      if (next.system_id) p.set('system_id', next.system_id);
      if (next.assignees) for (const a of next.assignees) p.append('assignees', a);
      if (next.q) p.set('q', next.q);
      const id = params.get('id');
      if (id) p.set('id', id);
      setParams(p, { replace: true });
    },
    [params, setParams],
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

  return { filter, setFilter, vocId, setVocId };
}
