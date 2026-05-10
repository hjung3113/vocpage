/**
 * FAQ page - Wave 4 FE step 3.
 * Spec: docs/specs/requires/feature-notice-faq.md sections 10.4 and 10.5.
 *
 * Decisions:
 * 1. Accordion (Q click - A expands) - drawer not adopted (NoticePage D-NOTICE-1).
 * 2. Keyword search uses client-side filtering (Q/A substring, case-insensitive).
 *    Matches highlighted via <mark> with var(--mark-bg) token. Server `q` also
 *    supported but FE filtering keeps highlighting consistent.
 * 3. Admin mode: same `?mode=admin` URL toggle as NoticePage, role-gated.
 *    Categories tab rendered only for role==='admin' (manager excluded).
 * (D-FAQ, 2026-05-09)
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StickyHeaderLayout, PageHeader } from '@widgets/app-shell';
import { Button } from '@shared/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/ui/tabs';
import { useRole } from '@entities/user/model/useRole';
import {
  faqApi,
  faqQueryKeys,
  useFaqList,
  useFaqCategories,
  useCreateFaq,
  useDeleteFaq,
  useRestoreFaq,
  type Faq,
  type FaqCategory,
  type FaqCreate,
  type FaqUpdate,
} from '@entities/faq';
import { FaqFormDialog } from './FaqFormDialog';
import { FaqCategoriesTab } from './FaqCategoriesTab';
import { FaqItemsView, ALL_CATEGORIES } from './FaqItemsView';

export default function FaqPage() {
  const { isAdmin, isManager } = useRole();
  const canManage = isAdmin || isManager;

  const [searchParams, setSearchParams] = useSearchParams();
  const isAdminMode = canManage && searchParams.get('mode') === 'admin';

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [tab, setTab] = useState<'items' | 'categories'>('items');
  const [q, setQ] = useState('');
  const [categoryId, setCategoryId] = useState<string>(ALL_CATEGORIES);

  const qc = useQueryClient();
  const list = useFaqList(isAdminMode ? { mode: 'admin', includeDeleted: true } : { mode: 'user' });
  const categoriesQuery = useFaqCategories();
  const categories: FaqCategory[] = categoriesQuery.data?.rows ?? [];

  const createMut = useCreateFaq();
  // Generic per-id update with optimistic+rollback (matches NoticePage pattern).
  const updateMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: FaqUpdate }) => faqApi.update(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: faqQueryKeys.all });
      const snapshots = qc.getQueriesData<{ rows: Faq[] }>({
        queryKey: faqQueryKeys.lists(),
      });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData(key, {
          ...data,
          rows: data.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        });
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: faqQueryKeys.all });
    },
  });
  const deleteMut = useDeleteFaq();
  const restoreMut = useRestoreFaq();

  const visibleRows = useMemo(() => {
    const rows = list.data?.rows ?? [];
    const base = isAdminMode ? rows : rows.filter((r) => r.deleted_at === null && r.is_visible);

    const trimmed = q.trim().toLowerCase();
    const filteredByCategory =
      categoryId === ALL_CATEGORIES ? base : base.filter((r) => r.category_id === categoryId);

    if (!trimmed) return filteredByCategory;
    return filteredByCategory.filter(
      (r) => r.question.toLowerCase().includes(trimmed) || r.answer.toLowerCase().includes(trimmed),
    );
  }, [list.data, isAdminMode, q, categoryId]);

  const total = visibleRows.length;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(f: Faq) {
    setEditing(f);
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }
  async function submitForm(payload: FaqCreate) {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, patch: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
  }
  function toggleAdminMode() {
    const next = new URLSearchParams(searchParams);
    if (isAdminMode) next.delete('mode');
    else next.set('mode', 'admin');
    setSearchParams(next);
  }

  const itemsView = (
    <FaqItemsView
      q={q}
      setQ={setQ}
      categoryId={categoryId}
      setCategoryId={setCategoryId}
      categories={categories}
      rows={visibleRows}
      expandedId={expandedId}
      setExpandedId={setExpandedId}
      isAdminMode={isAdminMode}
      isAdmin={isAdmin}
      isPending={list.isPending}
      isError={list.isError}
      onEdit={openEdit}
      onDelete={(x) => deleteMut.mutate(x.id)}
      onRestore={(x) => restoreMut.mutate(x.id)}
      onToggleVisible={(x, next) => updateMut.mutate({ id: x.id, patch: { is_visible: next } })}
    />
  );

  return (
    <StickyHeaderLayout
      header={
        <PageHeader
          title="FAQ"
          count={total}
          actions={
            <>
              {canManage ? (
                <Button
                  type="button"
                  variant={isAdminMode ? 'secondary' : 'outline'}
                  data-testid="faq-admin-toggle"
                  onClick={toggleAdminMode}
                >
                  {isAdminMode ? '읽기 모드' : '관리'}
                </Button>
              ) : null}
              {isAdminMode && tab === 'items' ? (
                <Button type="button" data-testid="faq-create-button" onClick={openCreate}>
                  + 등록
                </Button>
              ) : null}
            </>
          }
        />
      }
    >
      <div data-testid="faq-page" className="flex flex-col gap-4">
        {isAdminMode ? (
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'items' | 'categories')}>
            <TabsList variant="underline" data-testid="faq-admin-tabs">
              <TabsTrigger value="items" variant="underline" data-testid="faq-tab-items">
                FAQ 항목
              </TabsTrigger>
              {isAdmin ? (
                <TabsTrigger
                  value="categories"
                  variant="underline"
                  data-testid="faq-tab-categories"
                >
                  카테고리 관리
                </TabsTrigger>
              ) : null}
            </TabsList>
            <TabsContent value="items">{itemsView}</TabsContent>
            {isAdmin ? (
              <TabsContent value="categories">
                <FaqCategoriesTab categories={categories} faqs={list.data?.rows ?? []} />
              </TabsContent>
            ) : null}
          </Tabs>
        ) : (
          itemsView
        )}

        <FaqFormDialog
          open={formOpen}
          initial={editing}
          categories={categories}
          onClose={closeForm}
          onSubmit={submitForm}
        />
      </div>
    </StickyHeaderLayout>
  );
}
