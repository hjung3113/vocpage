import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { vocApi } from '../../api/voc';
import { queryKeys } from '../../api/queryKeys';
import { useRole } from '../../hooks/useRole';
import {
  VocStatus,
  VocPriority,
  type InternalNote,
  type VocUpdate,
} from '../../../../shared/contracts/voc';
import { VocPermissionGate } from './VocPermissionGate';
import { LoadingState } from '../common/LoadingState';

interface Props {
  vocId: string | null;
  notes: InternalNote[] | undefined;
  notesLoading: boolean;
  pending: boolean;
  onClose: () => void;
  onPatch: (id: string, patch: VocUpdate) => Promise<unknown>;
  onAddNote: (id: string, body: string) => Promise<unknown>;
}

function useVocDetail(id: string | null) {
  const { role } = useRole();
  return useQuery({
    queryKey: id ? queryKeys.voc.detail(role, id) : ['voc', role, 'detail', 'none'],
    queryFn: () => vocApi.get(id!),
    enabled: !!id,
  });
}

export function VocDrawer({
  vocId,
  notes,
  notesLoading,
  pending,
  onClose,
  onPatch,
  onAddNote,
}: Props) {
  const detail = useVocDetail(vocId);
  const role = useRole();
  const [noteBody, setNoteBody] = useState('');

  useEffect(() => {
    if (!vocId) setNoteBody('');
  }, [vocId]);

  const open = !!vocId;
  const voc = detail.data;
  const canWriteNote = role.role !== 'user';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="ml-auto h-screen max-w-xl rounded-none"
        data-testid="voc-drawer"
        style={{ background: 'var(--bg-panel)' }}
      >
        <DialogHeader>
          <DialogTitle>{voc ? voc.title : 'VOC'}</DialogTitle>
        </DialogHeader>
        {detail.isLoading && <LoadingState />}
        {detail.isError && <VocPermissionGate reason="role" />}
        {voc && (
          <div className="flex flex-col gap-4 overflow-y-auto py-2">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs">
                Status
                <Select
                  value={voc.status}
                  onValueChange={(v) =>
                    onPatch(voc.id, { status: v as (typeof VocStatus.options)[number] })
                  }
                >
                  <SelectTrigger data-testid="drawer-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VocStatus.options.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Priority
                <Select
                  value={voc.priority}
                  onValueChange={(v) =>
                    onPatch(voc.id, { priority: v as (typeof VocPriority.options)[number] })
                  }
                >
                  <SelectTrigger data-testid="drawer-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VocPriority.options.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <section data-testid="drawer-notes">
              <h3 className="mb-2 text-sm font-semibold">Internal Notes</h3>
              {notesLoading && <LoadingState />}
              {!notesLoading && notes && notes.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  아직 작성된 노트가 없습니다.
                </p>
              )}
              <ul className="flex flex-col gap-2">
                {notes?.map((n) => (
                  <li
                    key={n.id}
                    className="rounded border p-2 text-sm"
                    style={{ borderColor: 'var(--border-standard)' }}
                  >
                    {n.body}
                  </li>
                ))}
              </ul>
              {canWriteNote && (
                <form
                  className="mt-3 flex flex-col gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (noteBody.trim()) {
                      onAddNote(voc.id, noteBody.trim()).then(() => setNoteBody(''));
                    }
                  }}
                >
                  <Textarea
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                    placeholder="노트를 입력하세요"
                    aria-label="new note"
                  />
                  <Button type="submit" disabled={pending || !noteBody.trim()} size="sm">
                    저장
                  </Button>
                </form>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
