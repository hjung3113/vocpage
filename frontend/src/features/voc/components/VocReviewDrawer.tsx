import { useQuery } from '@tanstack/react-query';
import { useState, useContext } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '../../../components/ui/dialog';
import { cn } from '../../../lib/utils';
import { vocApi } from '../../../api/voc';
import { queryKeys } from '../../../api/queryKeys';
import { useRole } from '../../../hooks/useRole';
import { AuthContext } from '../../../contexts/AuthContext';
import { type InternalNote } from '../../../../../shared/contracts/voc';
import { VocPermissionGate } from '../../../components/voc/VocPermissionGate';
import { LoadingState } from '../../../components/common/LoadingState';
import { ErrorState } from '../../../components/common/ErrorState';
import { type AttachmentItem } from './VocReviewSections';
import { VocDrawerSections } from './VocDrawerSections';
import { VocReviewMetaPanel } from './VocReviewMetaPanel';
import { DrawerActionButtons } from './DrawerActionButtons';
import { VocBodySection } from './VocBodySection';
import { VocAttachmentsPanel } from './VocReviewSections';

const ISSUE_CODE_STYLE: React.CSSProperties = {
  color: 'var(--accent)',
  fontFamily: 'D2Coding, monospace',
};

const TITLE_STYLE: React.CSSProperties = {
  color: 'var(--text-primary)',
};

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

  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?voc=${vocId}`;
    void navigator.clipboard.writeText(url);
  };

  const handleToggleFullscreen = () => setIsFullscreen((v) => !v);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-pcomp="voc-review-drawer"
        className={cn(
          'right-0 top-0 left-auto h-screen translate-x-0 translate-y-0 rounded-none sm:rounded-none p-0 flex flex-col',
          isFullscreen ? 'max-w-full w-full' : 'max-w-xl',
        )}
        data-testid="voc-drawer"
        style={{ background: 'var(--bg-panel)' }}
      >
        {/* Visually hidden a11y title/description */}
        <DialogTitle className="sr-only">{voc ? voc.title : 'VOC'}</DialogTitle>
        <DialogDescription className="sr-only">VOC 상세 검토 패널</DialogDescription>

        {/* Custom header */}
        <div
          className="flex items-start gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border-standard)' }}
        >
          <div className="flex-1 min-w-0">
            {voc && (
              <div
                className="text-xs font-semibold mb-1"
                style={ISSUE_CODE_STYLE}
                data-testid="drawer-issue-code"
              >
                {voc.issue_code}
              </div>
            )}
            <div className="text-base font-bold truncate" style={TITLE_STYLE}>
              {voc ? voc.title : 'VOC'}
            </div>
          </div>
          <DrawerActionButtons
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            onCopyLink={handleCopyLink}
            onClose={onClose}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
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
            <div className="flex flex-col gap-4">
              <VocReviewMetaPanel
                voc={voc}
                assigneeMap={assigneeMap}
                vocTypeMap={vocTypeMap}
                systemMap={systemMap}
                menuMap={menuMap}
              />
              <VocBodySection body={voc.body} />
              <VocAttachmentsPanel items={attachments} canUpload={canUpload} />
              <VocDrawerSections
                vocId={voc.id}
                parentIsSubtask={voc.parent_id !== null}
                currentUserId={auth?.user?.id ?? ''}
                role={role}
                isOwner={!!auth?.user?.id && voc.assignee_id === auth.user.id}
                canWrite={canWrite}
                pending={pending}
                notes={notes}
                notesLoading={notesLoading}
                historyEntries={history.data}
                historyLoading={history.isLoading}
                onAddNote={(body) => void onAddNote(voc.id, body)}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VocReviewDrawer;
