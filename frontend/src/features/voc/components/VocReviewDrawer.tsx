import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { vocApi } from '../../../api/voc';
import { queryKeys } from '../../../api/queryKeys';
import { useContext } from 'react';
import { useRole } from '../../../hooks/useRole';
import { AuthContext } from '../../../contexts/AuthContext';
import {
  VocStatus,
  VocPriority,
  type InternalNote,
  type VocUpdate,
} from '../../../../../shared/contracts/voc';
import { VocPermissionGate } from '../../../components/voc/VocPermissionGate';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import { type AttachmentItem } from './VocReviewSections';
import { VocDrawerSections } from './VocDrawerSections';
import { VocReviewMetaPanel } from './VocReviewMetaPanel';

const STATUS_LOCK_TITLE = '결과 검토가 승인되어 상태 변경이 잠겨 있습니다.';
const STATUS_LOCK_LABEL = '상태 변경 잠김: 결과 검토가 승인되었습니다.';

interface Props {
  vocId: string | null;
  notes: InternalNote[] | undefined;
  notesLoading: boolean;
  pending: boolean;
  attachments?: AttachmentItem[];
  assigneeMap: Record<string, string>;
  vocTypeMap?: Record<string, { slug: string; name: string }>;
  systemMap?: Record<string, string>;
  menuMap?: Record<string, string>;
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
  assigneeMap,
  vocTypeMap,
  systemMap,
  menuMap,
  onClose,
  onPatch,
  onAddNote,
}: Props) {
  const detail = useVocDetail(vocId);
  const history = useVocHistory(vocId);
  const { role } = useRole();
  const auth = useContext(AuthContext);
  const open = !!vocId;
  const voc = detail.data;
  const canWrite = role !== 'user';
  const canUpload = role === 'manager' || role === 'admin';
  const isDeleted = !!voc?.deleted_at;
  const blockedDeleted = isDeleted && role !== 'admin';
  const approvedLock = voc?.review_status === 'approved';

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
          <DialogDescription className="sr-only">VOC 상세 검토 패널</DialogDescription>
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
            <VocReviewMetaPanel
              voc={voc}
              assigneeMap={assigneeMap}
              vocTypeMap={vocTypeMap}
              systemMap={systemMap}
              menuMap={menuMap}
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs">
                Status
                <Select
                  disabled={approvedLock}
                  value={voc.status}
                  onValueChange={(v) =>
                    onPatch(voc.id, { status: v as (typeof VocStatus.options)[number] })
                  }
                >
                  <SelectTrigger
                    data-testid="drawer-status"
                    title={approvedLock ? STATUS_LOCK_TITLE : undefined}
                    aria-label={approvedLock ? STATUS_LOCK_LABEL : '상태 변경'}
                  >
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
            <VocDrawerSections
              vocId={voc.id}
              parentIsSubtask={voc.parent_id !== null}
              currentUserId={auth?.user?.id ?? ''}
              role={role}
              isOwner={!!auth?.user?.id && voc.assignee_id === auth.user.id}
              canWrite={canWrite}
              canUpload={canUpload}
              pending={pending}
              notes={notes}
              notesLoading={notesLoading}
              attachments={attachments}
              historyEntries={history.data}
              historyLoading={history.isLoading}
              onAddNote={(body) => void onAddNote(voc.id, body)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default VocReviewDrawer;
