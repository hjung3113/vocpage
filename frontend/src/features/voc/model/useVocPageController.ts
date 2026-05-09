import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVocList } from '@features/voc/model/useVocList';
import { useVocFilters } from '@features/voc/list/model/useVocFilters';
import { useUpdateVoc, useAddNote, useNotes } from '@features/voc/model/useVocMutation';
import { useRole } from '@entities/user/model/useRole';
import { useCreateVoc } from '@features/voc/create/model/useCreateVoc';
import { mastersApi, masterQueryKeys } from '@entities/master';
import { notificationsApi, notificationQueryKeys } from '@entities/notification';
import type { VocFilter, VocSortColumn, SortDir, VocCreate, VocStatus } from '@contracts/voc';
import type { NotificationItem } from '@contracts/notification';

/** Single composition root for the VOC page — keeps `VocListPage` thin. */
export function useVocPageController() {
  const role = useRole();
  const qc = useQueryClient();
  const { state, setFilter, setSort, setPage, vocId, setVocId } = useVocFilters();
  const { filter, sortBy, sortDir, page, perPage } = state;
  const list = useVocList(filter, sortBy, sortDir, page, perPage);
  const updateVoc = useUpdateVoc();
  const addNote = useAddNote();
  const notes = useNotes(vocId);

  const assigneesQ = useQuery({
    queryKey: masterQueryKeys.assignees.list(role.role),
    queryFn: () => mastersApi.assignees(),
    staleTime: 5 * 60_000,
  });
  const tagsQ = useQuery({
    queryKey: masterQueryKeys.tags.list(role.role),
    queryFn: () => mastersApi.tags(),
    staleTime: 5 * 60_000,
  });
  const vocTypesQ = useQuery({
    queryKey: masterQueryKeys.vocTypes.list(role.role),
    queryFn: () => mastersApi.vocTypes(),
    staleTime: 5 * 60_000,
  });
  const notificationsQ = useQuery({
    queryKey: notificationQueryKeys.list(),
    queryFn: () => notificationsApi.list(),
    staleTime: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationQueryKeys.all }),
  });

  const createVoc = useCreateVoc();

  const [createOpen, setCreateOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const assigneeMap = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const a of assigneesQ.data ?? []) m[a.id] = a.display_name;
    return m;
  }, [assigneesQ.data]);

  const onStatusChange = useCallback(
    (next: VocStatus[] | 'all') => {
      const status = next === 'all' ? undefined : next;
      setFilter({ ...filter, status });
    },
    [filter, setFilter],
  );

  const onAdvancedChange = useCallback(
    (next: Pick<VocFilter, 'assignees' | 'priorities' | 'voc_type_ids' | 'tag_ids'>) => {
      setFilter({ ...filter, ...next });
    },
    [filter, setFilter],
  );

  const onAdvancedReset = useCallback(() => {
    setFilter({
      ...filter,
      assignees: undefined,
      priorities: undefined,
      voc_type_ids: undefined,
      tag_ids: undefined,
    });
  }, [filter, setFilter]);

  const onSortChange = useCallback(
    (key: VocSortColumn, dir: SortDir) => setSort(key, dir),
    [setSort],
  );

  const notifications: { items: NotificationItem[]; unreadCount: number } = {
    items: notificationsQ.data?.items ?? [],
    unreadCount: notificationsQ.data?.unreadCount ?? 0,
  };

  return {
    role,
    state,
    filter,
    setFilter,
    sortBy,
    sortDir,
    page,
    perPage,
    setSort: onSortChange,
    setPage,
    list,
    drawer: { vocId, open: setVocId, close: () => setVocId(null) },
    notes,
    masters: {
      assignees: assigneesQ.data ?? [],
      tags: tagsQ.data ?? [],
      vocTypes: vocTypesQ.data ?? [],
      assigneeMap,
    },
    notifications: {
      ...notifications,
      onMarkAllRead: () => markAllRead.mutate(),
      onItemClick: (id: string) => {
        const item = notifications.items.find((n) => n.id === id);
        if (item?.href) {
          const m = item.href.match(/\/voc\/([0-9a-f-]+)/i);
          if (m) setVocId(m[1] ?? null);
        }
      },
    },
    advanced: {
      open: advancedOpen,
      onToggle: () => setAdvancedOpen((v) => !v),
      onChange: onAdvancedChange,
      onReset: onAdvancedReset,
    },
    create: {
      open: createOpen,
      setOpen: setCreateOpen,
      onSubmit: async (payload: VocCreate) => {
        // TODO(wave-1.6 BE): VocCreateModal now passes File[] as 2nd arg; wire upload endpoint here
        await createVoc.mutateAsync(payload);
        setCreateOpen(false);
      },
      submitting: createVoc.isPending,
    },
    onStatusChange,
    actions: {
      patch: (id: string, patch: Parameters<typeof updateVoc.mutate>[0]['patch']) =>
        updateVoc.mutateAsync({ id, patch }),
      addNote: (id: string, body: string) => addNote.mutateAsync({ id, body }),
    },
    pending: updateVoc.isPending || addNote.isPending,
  };
}
