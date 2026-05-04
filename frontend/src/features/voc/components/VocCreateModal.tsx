import { Suspense, lazy, useEffect, useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { LoadingState } from '../../../components/common/LoadingState';
import {
  VocCreate,
  type VocCreate as VocCreateInput,
} from '../../../../../shared/contracts/voc/io';
import type { VocPriority } from '../../../../../shared/contracts/voc/entity';
import type { VocTypeListItem } from '../../../../../shared/contracts/master/io';
import { NativeSelect } from './NativeSelect';
import { AttachmentZone } from '../../../shared/ui/AttachmentZone/AttachmentZone';

const ToastBodyEditor = lazy(() => import('./ToastBodyEditor'));

interface IdLabel {
  id: string;
  label: string;
}

export interface VocCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vocTypes: VocTypeListItem[];
  systems: IdLabel[];
  menus: IdLabel[];
  onSubmit: (payload: VocCreateInput, files: File[]) => Promise<void>;
  submitting: boolean;
}

interface FormState {
  title: string;
  body: string;
  voc_type_id: string;
  system_id: string;
  menu_id: string;
  priority: VocPriority;
}

const PRIORITIES: VocPriority[] = ['urgent', 'high', 'medium', 'low'];

function makeInitial(vt: VocTypeListItem[], sy: IdLabel[], mn: IdLabel[]): FormState {
  return {
    title: '',
    body: '',
    voc_type_id: vt[0]?.id ?? '',
    system_id: sy[0]?.id ?? '',
    menu_id: mn[0]?.id ?? '',
    priority: 'medium',
  };
}

export function VocCreateModal({
  open,
  onOpenChange,
  vocTypes,
  systems,
  menus,
  onSubmit,
  submitting,
}: VocCreateModalProps) {
  const [form, setForm] = useState<FormState>(() => makeInitial(vocTypes, systems, menus));
  const [titleErr, setTitleErr] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (open) {
      setForm(makeInitial(vocTypes, systems, menus));
      setTitleErr('');
      setFiles([]);
    }
  }, [open, vocTypes, systems, menus]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setTitleErr('제목은 필수입니다');
      return;
    }
    const parsed = VocCreate.safeParse({
      title: form.title.trim(),
      body: form.body || undefined,
      priority: form.priority,
      voc_type_id: form.voc_type_id,
      system_id: form.system_id,
      menu_id: form.menu_id,
    });
    if (!parsed.success) {
      setTitleErr('입력값이 올바르지 않습니다');
      return;
    }
    await onSubmit(parsed.data, files);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-pcomp="voc-create-modal"
        aria-label="새 VOC 등록"
        className="max-h-[90vh] w-[min(92vw,42rem)] max-w-none overflow-y-auto overflow-x-hidden bg-[color:var(--bg-surface)] text-[color:var(--text-primary)]"
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>새 VOC 등록</DialogTitle>
          <DialogClose className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="voc-title">제목</Label>
            <Input
              id="voc-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="VOC 제목을 입력하세요"
            />
            {titleErr && (
              <span className="text-xs text-[color:var(--status-drop)]">{titleErr}</span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor="voc-type">유형</Label>
              <NativeSelect
                id="voc-type"
                value={form.voc_type_id}
                onChange={(v) => set('voc_type_id', v)}
                options={vocTypes.map((t) => ({ id: t.id, label: t.name }))}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor="voc-system">시스템</Label>
              <NativeSelect
                id="voc-system"
                value={form.system_id}
                onChange={(v) => set('system_id', v)}
                options={systems}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <Label htmlFor="voc-menu">메뉴</Label>
              <NativeSelect
                id="voc-menu"
                value={form.menu_id}
                onChange={(v) => set('menu_id', v)}
                options={menus}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="voc-priority">우선순위</Label>
            <select
              id="voc-priority"
              value={form.priority}
              onChange={(e) => set('priority', e.target.value as VocPriority)}
              className="h-10 w-40 rounded-md border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] px-3 text-sm text-[color:var(--text-primary)]"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-1 overflow-hidden">
            <Label>본문</Label>
            <Suspense fallback={<LoadingState label="에디터 로딩" />}>
              <ToastBodyEditor value={form.body} onChange={(md) => set('body', md)} />
            </Suspense>
          </div>
          <AttachmentZone files={files} onChange={setFiles} disabled={submitting} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default VocCreateModal;
