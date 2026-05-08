import { useEffect, useState } from 'react';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/ui/dialog';
import type { Faq, FaqCategory, FaqCreate } from '@entities/faq';

interface FaqFormState {
  question: string;
  answer: string;
  category_id: string;
  is_visible: boolean;
  sort_order: number;
}

const EMPTY_FORM: FaqFormState = {
  question: '',
  answer: '',
  category_id: '',
  is_visible: true,
  sort_order: 0,
};

function toCreatePayload(form: FaqFormState): FaqCreate {
  return {
    question: form.question,
    answer: form.answer,
    category_id: form.category_id,
    is_visible: form.is_visible,
    sort_order: form.sort_order,
  };
}

function toFormState(f: Faq): FaqFormState {
  return {
    question: f.question,
    answer: f.answer,
    category_id: f.category_id,
    is_visible: f.is_visible,
    sort_order: f.sort_order,
  };
}

interface Props {
  open: boolean;
  initial: Faq | null;
  categories: FaqCategory[];
  onClose: () => void;
  onSubmit: (payload: FaqCreate) => Promise<void> | void;
}

export function FaqFormDialog({ open, initial, categories, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FaqFormState>(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      const next = initial
        ? toFormState(initial)
        : { ...EMPTY_FORM, category_id: categories[0]?.id ?? '' };
      setForm(next);
    }
  }, [open, initial, categories]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="faq-form-dialog">
        <DialogHeader>
          <DialogTitle>{initial ? 'FAQ 수정' : 'FAQ 등록'}</DialogTitle>
        </DialogHeader>
        <form
          data-testid="faq-form"
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void Promise.resolve(onSubmit(toCreatePayload(form))).then(onClose);
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--text-secondary)]">질문 (Q)</span>
            <input
              data-testid="faq-form-question"
              required
              value={form.question}
              onChange={(e) => setForm((s) => ({ ...s, question: e.target.value }))}
              className="h-9 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-2 text-[color:var(--text-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--text-secondary)]">답변 (A)</span>
            <textarea
              data-testid="faq-form-answer"
              required
              value={form.answer}
              onChange={(e) => setForm((s) => ({ ...s, answer: e.target.value }))}
              rows={5}
              className="rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] p-2 text-[color:var(--text-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--text-secondary)]">카테고리</span>
            <select
              data-testid="faq-form-category"
              required
              value={form.category_id}
              onChange={(e) => setForm((s) => ({ ...s, category_id: e.target.value }))}
              className="h-9 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-2"
            >
              <option value="" disabled>
                선택
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                data-testid="faq-form-is-visible"
                checked={form.is_visible}
                onChange={(e) => setForm((s) => ({ ...s, is_visible: e.target.checked }))}
              />
              노출
            </label>
            <label className="flex items-center gap-2">
              <span className="text-[color:var(--text-secondary)]">정렬</span>
              <input
                type="number"
                data-testid="faq-form-sort-order"
                value={form.sort_order}
                onChange={(e) =>
                  setForm((s) => ({ ...s, sort_order: Number(e.target.value) || 0 }))
                }
                className="h-8 w-20 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-2"
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" data-testid="faq-form-submit">
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
