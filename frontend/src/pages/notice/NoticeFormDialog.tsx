import { useEffect, useState } from 'react';
import { Button } from '@shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/ui/dialog';
import type { Notice, NoticeCreate, NoticeImportance } from '@entities/notice';

interface NoticeFormState {
  title: string;
  body: string;
  level: NoticeImportance;
  is_popup: boolean;
  is_visible: boolean;
  visible_from: string;
  visible_to: string;
}

const EMPTY_FORM: NoticeFormState = {
  title: '',
  body: '',
  level: 'normal',
  is_popup: false,
  is_visible: true,
  visible_from: '',
  visible_to: '',
};

function toCreatePayload(form: NoticeFormState): NoticeCreate {
  return {
    title: form.title,
    body: form.body,
    level: form.level,
    is_popup: form.is_popup,
    is_visible: form.is_visible,
    visible_from: form.visible_from ? new Date(form.visible_from).toISOString() : null,
    visible_to: form.visible_to ? new Date(form.visible_to).toISOString() : null,
  };
}

function toFormState(n: Notice): NoticeFormState {
  return {
    title: n.title,
    body: n.body,
    level: n.level,
    is_popup: n.is_popup,
    is_visible: n.is_visible,
    visible_from: n.visible_from ? n.visible_from.slice(0, 10) : '',
    visible_to: n.visible_to ? n.visible_to.slice(0, 10) : '',
  };
}

interface Props {
  open: boolean;
  initial: Notice | null;
  onClose: () => void;
  onSubmit: (payload: NoticeCreate) => Promise<void> | void;
}

export function NoticeFormDialog({ open, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<NoticeFormState>(EMPTY_FORM);

  useEffect(() => {
    if (open) setForm(initial ? toFormState(initial) : EMPTY_FORM);
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="notice-form-dialog">
        <DialogHeader>
          <DialogTitle>{initial ? '공지 수정' : '공지 등록'}</DialogTitle>
        </DialogHeader>
        <form
          data-testid="notice-form"
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void Promise.resolve(onSubmit(toCreatePayload(form))).then(onClose);
          }}
        >
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--text-secondary)]">제목</span>
            <input
              data-testid="notice-form-title"
              required
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              className="h-9 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-2 text-[color:var(--text-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--text-secondary)]">내용</span>
            <textarea
              data-testid="notice-form-body"
              required
              value={form.body}
              onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
              rows={5}
              className="rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] p-2 text-[color:var(--text-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-[color:var(--text-secondary)]">중요도</span>
            <select
              data-testid="notice-form-level"
              value={form.level}
              onChange={(e) =>
                setForm((s) => ({ ...s, level: e.target.value as NoticeImportance }))
              }
              className="h-9 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-2"
            >
              <option value="normal">일반</option>
              <option value="important">중요</option>
              <option value="urgent">긴급</option>
            </select>
          </label>
          <div className="flex gap-2">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-[color:var(--text-secondary)]">노출 시작</span>
              <input
                type="date"
                data-testid="notice-form-visible-from"
                value={form.visible_from}
                onChange={(e) => setForm((s) => ({ ...s, visible_from: e.target.value }))}
                className="h-9 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-2"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="text-[color:var(--text-secondary)]">노출 종료</span>
              <input
                type="date"
                data-testid="notice-form-visible-to"
                value={form.visible_to}
                onChange={(e) => setForm((s) => ({ ...s, visible_to: e.target.value }))}
                className="h-9 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-2"
              />
            </label>
          </div>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                data-testid="notice-form-is-popup"
                checked={form.is_popup}
                onChange={(e) => setForm((s) => ({ ...s, is_popup: e.target.checked }))}
              />
              팝업 표시
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                data-testid="notice-form-is-visible"
                checked={form.is_visible}
                onChange={(e) => setForm((s) => ({ ...s, is_visible: e.target.checked }))}
              />
              노출
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" data-testid="notice-form-submit">
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
