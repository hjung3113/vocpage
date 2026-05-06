import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { FilePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@shared/ui/dialog';
import { LoadingState } from '@shared/ui/skeleton';
import { AttachmentZone } from '@shared/ui/attachment-zone';
import { VocCreate, type VocCreate as VocCreateInput } from '@contracts/voc/io';
import type { VocPriority, VocStatus } from '@contracts/voc/entity';
import type { VocTypeListItem } from '@contracts/master/io';
import { VocCreateTypeChips } from './VocCreateTypeChips';
import { VocCreateDetails } from './VocCreateDetails';
import { VocCreateFooter } from './VocCreateFooter';
import { VocCreateTitleInput } from './VocCreateTitleInput';

const ToastBodyEditor = lazy(() => import('./ToastBodyEditor'));

interface IdLabel {
  id: string;
  label: string;
}

export interface VocCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vocTypes: VocTypeListItem[];
  systems: IdLabel[];
  menus: IdLabel[];
  assignees?: IdLabel[];
  onSubmit: (payload: VocCreateInput, files: File[]) => Promise<void>;
  submitting: boolean;
}

interface DraftState {
  voc_type_id: string | undefined;
  system_id: string | undefined;
  menu_id: string | undefined;
  priority: VocPriority;
  status: VocStatus;
  assignee_id: string | null;
}

export function VocCreateDialog({
  open,
  onOpenChange,
  vocTypes,
  systems,
  menus,
  assignees = [],
  onSubmit,
  submitting,
}: VocCreateDialogProps) {
  const makeDraft = (): DraftState => ({
    voc_type_id: vocTypes[0]?.id,
    system_id: systems[0]?.id,
    menu_id: menus[0]?.id,
    priority: 'medium',
    status: '접수',
    assignee_id: null,
  });

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [titleErr, setTitleErr] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [draft, setDraft] = useState<DraftState>(makeDraft);
  const [createAnother, setCreateAnother] = useState(false);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Reset when dialog opens or master data changes
  useEffect(() => {
    if (open) {
      setTitle('');
      setBody('');
      setDraft(makeDraft());
      setTitleErr('');
      setFiles([]);
      setTimeout(() => titleRef.current?.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vocTypes, systems, menus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleErr('제목은 필수입니다');
      titleRef.current?.focus();
      return;
    }
    const parsed = VocCreate.safeParse({
      title: title.trim(),
      body: body || undefined,
      priority: draft.priority,
      voc_type_id: draft.voc_type_id,
      system_id: draft.system_id,
      menu_id: draft.menu_id,
      assignee_id: draft.assignee_id ?? undefined,
    });
    if (!parsed.success) {
      setTitleErr('입력값이 올바르지 않습니다');
      return;
    }
    await onSubmit(parsed.data, files);
    if (createAnother) {
      setTitle('');
      setBody('');
      setDraft(makeDraft());
      setTitleErr('');
      setFiles([]);
      setTimeout(() => titleRef.current?.focus(), 50);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="voc-create-dialog"
        aria-describedby={undefined}
        className="w-full p-0 gap-0 flex flex-col overflow-hidden"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-standard)',
          maxWidth: 'min(720px, calc(100vw - 32px))',
          maxHeight: 'min(85vh, 720px)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <FilePlus size={16} style={{ color: 'var(--text-quaternary)' }} aria-hidden />
          <DialogTitle
            className="text-[14px] font-medium"
            style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)' }}
          >
            새 VOC 등록
          </DialogTitle>
        </div>

        {/* Body: 2-column layout */}
        <form
          id="voc-create-dialog-form"
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          <div data-testid="voc-create-body" className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left: main content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-w-0">
              <VocCreateTypeChips
                vocTypes={vocTypes}
                activeTypeId={draft.voc_type_id}
                onChange={(id) => setDraft((prev) => ({ ...prev, voc_type_id: id }))}
              />

              <VocCreateTitleInput
                ref={titleRef}
                value={title}
                error={titleErr}
                onChange={(v) => {
                  setTitle(v);
                  setTitleErr('');
                }}
              />

              {/* Body editor */}
              <div className="flex-1">
                <Suspense fallback={<LoadingState label="에디터 로딩" />}>
                  <ToastBodyEditor value={body} onChange={(md) => setBody(md)} />
                </Suspense>
              </div>

              {/* Attachments */}
              <AttachmentZone files={files} onChange={setFiles} disabled={submitting} />
            </div>

            {/* Right: details sidebar */}
            <VocCreateDetails
              status={draft.status}
              priority={draft.priority}
              voc_type_id={draft.voc_type_id}
              system_id={draft.system_id}
              menu_id={draft.menu_id}
              assignee_id={draft.assignee_id}
              vocTypes={vocTypes}
              systems={systems}
              menus={menus}
              assignees={assignees}
              onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
            />
          </div>

          <VocCreateFooter
            createAnother={createAnother}
            onCreateAnotherChange={setCreateAnother}
            submitting={submitting}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default VocCreateDialog;
