import { useState } from 'react';
import { useVocList } from './useVocList';
import { useVocFilters } from './useVocFilters';
import { useUpdateVoc, useAddNote, useNotes } from './useVocMutation';
import { useRole } from '../../hooks/useRole';
import type { VocListQuery } from '../../../../shared/contracts/voc';

/** Single composition root for the VOC page — keeps `VocListPage` thin. */
export function useVocPageController() {
  const [sort_by, setSort] = useState<VocListQuery['sort_by']>('created_at');
  const [sort_dir, setOrder] = useState<VocListQuery['sort_dir']>('desc');
  const role = useRole();
  const { filter, setFilter, vocId, setVocId } = useVocFilters();
  const list = useVocList(filter, sort_by, sort_dir);
  const updateVoc = useUpdateVoc();
  const addNote = useAddNote();
  const notes = useNotes(vocId);

  return {
    role,
    filter,
    setFilter,
    sort: sort_by,
    order: sort_dir,
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
