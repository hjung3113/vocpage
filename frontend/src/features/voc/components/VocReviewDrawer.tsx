import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { vocApi } from '../../../api/voc';
import { queryKeys } from '../../../api/queryKeys';
import { useRole } from '../../../hooks/useRole';
import {
  VocStatus,
  VocPriority,
  type InternalNote,
  type VocUpdate,
} from '../../../../../shared/contracts/voc';
import { VocPermissionGate } from '../../../components/voc/VocPermissionGate';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import {
  VocCommentsPanel,
  VocAttachmentsPanel,
  VocHistoryPanel,
  type AttachmentItem,
} from './VocReviewTabs';

interface Props {
  vocId: string | null;
  notes: InternalNote[] | undefined;
  notesLoading: boolean;
  pending: boolean;
  attachments?: AttachmentItem[];
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

function useVocHistory(id: string | null) {
  const { role } = useRole();
  return useQuery({
    queryKey: id ? queryKeys.voc.history(role, id) : ['voc', role, 'history', 'none'],
    queryFn: () => vocApi.history(id!),
    enabled: !!id,
  });
}

export function VocReviewDrawer({
  vocId,
  notes,
  notesLoading,
  pending,
  attachments = [],
  onClose,
  onPatch,
  onAddNote,
}: Props) {
  const detail = useVocDetail(vocId);
  const history = useVocHistory(vocId);
  const { role } = useRole();
  const open = !!vocId;
  const voc = detail.data;
  const canWrite = role !== 'user';
  const canUpload = role === 'manager' || role === 'admin';
  const isDeleted = !!voc?.deleted_at;
  const blockedDeleted = isDeleted && role !== 'admin';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-pcomp="voc-review-drawer"
        className="ml-auto h-screen max-w-xl rounded-none"
        data-testid="voc-drawer"
        style={{ background: 'var(--bg-panel)' }}
      >
        <DialogHeader>
          <DialogTitle>{voc ? voc.title : 'VOC'}</DialogTitle>
        </DialogHeader>
        {detail.isLoading && <LoadingState />}
        {detail.isError &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((detail.error as any)?.response?.status === 403 ? (
            <VocPermissionGate reason="role" />
          ) : (
            <ErrorState />
          ))}
        {voc && blockedDeleted && <VocPermissionGate reason="deleted" />}
        {voc && !blockedDeleted && (
          <div className="flex flex-col gap-4 overflow-y-auto py-2">
            <div
              className="font-mono text-xs"
              style={{ color: 'var(--text-secondary)' }}
              data-testid="drawer-meta"
            >
              {voc.issue_code} · 등록 {voc.created_at.slice(0, 10)}
            </div>
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
            <Tabs defaultValue="comments" className="flex flex-col gap-3">
              <TabsList>
                <TabsTrigger value="comments">코멘트</TabsTrigger>
                <TabsTrigger value="attachments">첨부</TabsTrigger>
                <TabsTrigger value="history">변경이력</TabsTrigger>
              </TabsList>
              <VocCommentsPanel
                notes={notes}
                notesLoading={notesLoading}
                canWrite={canWrite}
                pending={pending}
                onAdd={(body) => {
                  void onAddNote(voc.id, body);
                }}
              />
              <VocAttachmentsPanel items={attachments} canUpload={canUpload} />
              <VocHistoryPanel entries={history.data} loading={history.isLoading} />
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default VocReviewDrawer;
