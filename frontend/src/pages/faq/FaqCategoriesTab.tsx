import { useState } from 'react';
import { Button } from '@shared/ui/button';
import { toast } from '@shared/ui/toast';
import { ApiError } from '@shared/api/client';
import {
  useCreateFaqCategory,
  useDeleteFaqCategory,
  useUpdateFaqCategory,
  type FaqCategory,
  type FaqCategoryCreate,
  type Faq,
} from '@entities/faq';
import { FaqCategoryFormDialog } from './FaqCategoryFormDialog';

interface Props {
  categories: FaqCategory[];
  faqs: Faq[];
}

/**
 * Admin-only categories management. Spec §10.4.4.
 *
 * Decisions:
 * 1. Inline `is_archived` toggle is intentionally NOT implemented — the
 *    existing `useUpdateFaqCategory(id)` hook binds id at hook-call site, so
 *    a per-row toggle would require N hooks at top level. Edit dialog covers
 *    the same field. (D-FAQ-3, 2026-05-09)
 * 2. Delete: BE returns 409 `CATEGORY_HAS_ITEMS` when category still has FAQs;
 *    we surface the localized toast in `onError`. We also hint via `title`
 *    when client-side count > 0 so admins know in advance.
 */
export function FaqCategoriesTab({ categories, faqs }: Props) {
  const [editing, setEditing] = useState<FaqCategory | null>(null);
  const [open, setOpen] = useState(false);

  const createMut = useCreateFaqCategory();
  const updateMut = useUpdateFaqCategory(editing?.id ?? '');
  const deleteMut = useDeleteFaqCategory();

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(c: FaqCategory) {
    setEditing(c);
    setOpen(true);
  }
  async function submit(payload: FaqCategoryCreate) {
    if (editing) {
      await updateMut.mutateAsync(payload);
    } else {
      await createMut.mutateAsync(payload);
    }
  }

  function handleDelete(c: FaqCategory) {
    deleteMut.mutate(c.id, {
      onError: (err) => {
        if (err instanceof ApiError && err.code === 'CATEGORY_HAS_ITEMS') {
          toast.error('해당 카테고리에 FAQ 항목이 있어 삭제할 수 없습니다.');
        } else {
          toast.error('카테고리를 삭제하지 못했습니다.');
        }
      },
    });
  }

  return (
    <div data-testid="faq-categories-tab" className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          data-testid="faq-category-add"
          onClick={openCreate}
        >
          + 카테고리 추가
        </Button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--border-standard)] text-left text-[color:var(--text-secondary)]">
            <th className="py-2">이름</th>
            <th className="py-2">순서</th>
            <th className="py-2">표시 여부</th>
            <th className="py-2 text-right">액션</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => {
            const itemCount = faqs.filter(
              (f) => f.category_id === c.id && f.deleted_at === null,
            ).length;
            return (
              <tr
                key={c.id}
                data-testid={`faq-category-row-${c.id}`}
                className="border-b border-[color:var(--border-standard)]"
              >
                <td className="py-2 text-[color:var(--text-primary)]">{c.name}</td>
                <td className="py-2 text-[color:var(--text-secondary)]">{c.sort_order}</td>
                <td className="py-2 text-xs text-[color:var(--text-secondary)]">
                  {c.is_archived ? '숨김' : '표시'}
                </td>
                <td className="flex justify-end gap-2 py-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid={`faq-category-edit-${c.id}`}
                    onClick={() => openEdit(c)}
                  >
                    편집
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    data-testid={`faq-category-delete-${c.id}`}
                    onClick={() => handleDelete(c)}
                    title={
                      itemCount > 0
                        ? '카테고리에 FAQ 항목이 있어 삭제할 수 없습니다.'
                        : undefined
                    }
                  >
                    삭제
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <FaqCategoryFormDialog
        open={open}
        initial={editing}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      />
    </div>
  );
}
