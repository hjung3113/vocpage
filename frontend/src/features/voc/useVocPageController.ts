import { useState } from 'react';
import { useVocList } from './useVocList';
import { useVocFilters } from './useVocFilters';
import { useUpdateVoc, useAddNote, useNotes } from './useVocMutation';
import { useRole } from '../../hooks/useRole';
import type { VocListQuery } from '../../../../shared/contracts/voc';

/** Single composition root for the VOC page — keeps `VocListPage` thin. */
export function useVocPageController() {
  const [sort, setSort] = useState<VocListQuery['sort']>('created_at');
  const [order, setOrder] = useState<VocListQuery['order']>('desc');
  const role = useRole();
  const { filter, setFilter, vocId, setVocId } = useVocFilters();
  const list = useVocList(filter, sort, order);
  const updateVoc = useUpdateVoc();
  const addNote = useAddNote();
  const notes = useNotes(vocId);

  return {
    role,
    filter,
    setFilter,
    sort,
    order,
    setSort,
    setOrder,
    list,
    drawer: { vocId, open: setVocId, close: () => setVocId(null) },
    notes,
    actions: {
      patch: (id: string, patch: Parameters<typeof updateVoc.mutate>[0]['patch']) =>
        updateVoc.mutateAsync({ id, patch }),
      addNote: (id: string, body: string) => addNote.mutateAsync({ id, body }),
    },
    pending: updateVoc.isPending || addNote.isPending,
  };
}
