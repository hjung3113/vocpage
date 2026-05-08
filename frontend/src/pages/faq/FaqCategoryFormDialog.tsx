import { useEffect, useState } from 'react';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/ui/dialog';
import type { FaqCategory, FaqCategoryCreate } from '@entities/faq';

interface State {
  name: string;
  slug: string;
  sort_order: number;
  is_archived: boolean;
}

const EMPTY: State = { name: '', slug: '', sort_order: 0, is_archived: false };

interface Props {
  open: boolean;
  initial: FaqCategory | null;
  onClose: () => void;
  onSubmit: (payload: FaqCategoryCreate) => Promise<void> | void;
}

export function FaqCategoryFormDialog({ open, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<State>(EMPTY);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              slug: initial.slug,
              sort_order: initial.sort_order,
              is_archived: initial.is_archived,
            }
          : EMPTY,
      );
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="faq-category-form-dialog">
        <DialogHeader>
          <DialogTitle>{initial ? '카테고리 수정' : '카테고리 추가'}</DialogTitle>
        </DialogHeader>
        <form
          data-testid="faq-category-form"
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void Promise.resolve(onSubmit(form)).then(onClose);
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--text-secondary)]">이름</span>
            <input
              data-testid="faq-category-form-name"
              required
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className="h-9 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-2 text-[color:var(--text-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--text-secondary)]">슬러그</span>
            <input
              data-testid="faq-category-form-slug"
              required
              value={form.slug}
              onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
              className="h-9 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-2 text-[color:var(--text-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--text-secondary)]">순서</span>
            <input
              type="number"
              data-testid="faq-category-form-sort"
              value={form.sort_order}
              onChange={(e) =>
                setForm((s) => ({ ...s, sort_order: Number(e.target.value) || 0 }))
              }
              className="h-9 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              data-testid="faq-category-form-archived"
              checked={form.is_archived}
              onChange={(e) => setForm((s) => ({ ...s, is_archived: e.target.checked }))}
            />
            아카이브 (숨김)
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" data-testid="faq-category-form-submit">
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
