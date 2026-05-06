import { useState, useContext } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@shared/ui/dialog';
import { cn } from '@shared/lib/cn';
import { useRole } from '@entities/user/model/useRole';
import { useVocDetail } from '../model/useDrawerQueries';
import { useVocPermissions } from '../model/useVocPermissions';
import { AuthContext } from '@features/auth/model/AuthContext';
import { type InternalNote } from '@contracts/voc';
import { VocPermissionGate } from './VocPermissionGate';
import { LoadingState } from '@shared/ui/skeleton';
import { ErrorState } from '@shared/ui/error-state';
import { type AttachmentItem } from './VocAttachmentSection';
import { DrawerActionButtons } from './DrawerActionButtons';
import { VocDrawerBody } from './VocDrawerBody';
import { VocStatusBadge, VocPriorityBadge } from '@entities/voc';

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
  tags?: string[];
  onClose: () => void;
  onAddNote: (id: string, body: string) => Promise<unknown>;
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
  tags,
  onClose,
  onAddNote,
}: Props) {
  const detail = useVocDetail(vocId);
  const { canWrite, canUpload, canSeeInternal } = useVocPermissions();
  const { role } = useRole();
  const auth = useContext(AuthContext);
  const open = !!vocId;
  const voc = detail.data;
  const isDeleted = !!voc?.deleted_at;
  const blockedDeleted = isDeleted && role !== 'admin';
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?voc=${vocId}`;
    void navigator.clipboard.writeText(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-pcomp="review-drawer"
        className={cn(
          'right-0 top-0 left-auto h-screen translate-x-0 translate-y-0 rounded-none sm:rounded-none p-0 flex flex-col',
          isFullscreen ? 'max-w-full w-full' : 'max-w-xl',
        )}
        data-testid="voc-drawer"
        style={{ background: 'var(--bg-panel)' }}
      >
        <DialogTitle className="sr-only">{voc ? voc.title : 'VOC'}</DialogTitle>
        <DialogDescription className="sr-only">VOC 상세 검토 패널</DialogDescription>

        <div
          className="px-4 pt-4 pb-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between gap-2 mb-2.5">
            {voc ? (
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold"
                style={{
                  fontFamily: 'D2Coding, monospace',
                  background: 'var(--brand-bg)',
                  color: 'var(--accent)',
                }}
                data-testid="drawer-issue-code"
              >
                {voc.issue_code}
              </span>
            ) : (
              <span />
            )}
            <DrawerActionButtons
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((v) => !v)}
              onCopyLink={handleCopyLink}
              onClose={onClose}
            />
          </div>
          <div
            className="text-sm font-semibold leading-snug"
            style={{ color: 'var(--text-primary)' }}
          >
            {voc ? voc.title : 'VOC'}
          </div>
          {voc && (
            <div className="flex items-center gap-1.5 mt-2">
              <VocStatusBadge status={voc.status} />
              <VocPriorityBadge priority={voc.priority} />
            </div>
          )}
        </div>

        <div
          className={
            isFullscreen ? 'flex-1 flex overflow-hidden' : 'flex-1 overflow-y-auto px-4 pt-4 pb-4'
          }
        >
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
            <VocDrawerBody
              voc={voc}
              isFullscreen={isFullscreen}
              attachments={attachments}
              assigneeMap={assigneeMap}
              vocTypeMap={vocTypeMap}
              systemMap={systemMap}
              menuMap={menuMap}
              tags={tags}
              currentUserId={auth?.user?.id ?? ''}
              role={role}
              isOwner={!!auth?.user?.id && voc.assignee_id === auth.user.id}
              canWrite={canWrite}
              canUpload={canUpload}
              canSeeInternal={canSeeInternal}
              pending={pending}
              notes={notes}
              notesLoading={notesLoading}
              onAddNote={(body) => void onAddNote(voc.id, body)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VocReviewDrawer;
