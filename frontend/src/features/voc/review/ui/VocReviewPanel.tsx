import { useContext, useEffect } from 'react';
import { useRole } from '@entities/user/model/useRole';
import { useVocDetail } from '../model/useDrawerQueries';
import { useVocPermissions } from '../model/useVocPermissions';
import { useUpdateVoc } from '@features/voc/model/useVocMutation';
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
  vocId: string;
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
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function VocReviewPanel({
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
  isFullscreen = false,
  onToggleFullscreen,
}: Props) {
  const detail = useVocDetail(vocId);
  const { canWrite, canUpload, canSeeInternal } = useVocPermissions();
  const { role } = useRole();
  const auth = useContext(AuthContext);
  const updateVoc = useUpdateVoc();
  const voc = detail.data;
  const isDeleted = !!voc?.deleted_at;
  const blockedDeleted = isDeleted && role !== 'admin';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleCopyLink = () => {
    const code = voc?.issue_code ?? vocId;
    const url = `${window.location.origin}${window.location.pathname}?id=${code}`;
    void navigator.clipboard.writeText(url);
  };

  return (
    <div
      data-testid="voc-drawer"
      className="flex flex-col h-full"
      style={{ background: 'var(--bg-panel)' }}
    >
      {/* Header — same as VocReviewDrawer header */}
      <div
        className="px-4 pt-3 pb-2.5 shrink-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {voc ? (
              <span
                className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-semibold"
                style={{
                  fontFamily: 'D2Coding, monospace',
                  background: 'var(--brand-bg)',
                  color: 'var(--accent)',
                }}
                data-testid="panel-issue-code"
              >
                {voc.issue_code}
              </span>
            ) : null}
            {voc && <VocStatusBadge status={voc.status} iconOnly />}
            {voc && <VocPriorityBadge priority={voc.priority} iconOnly />}
          </div>
          <DrawerActionButtons
            isFullscreen={isFullscreen}
            onToggleFullscreen={onToggleFullscreen ?? (() => {})}
            onCopyLink={handleCopyLink}
            onClose={onClose}
          />
        </div>
        <div
          className="text-[13px] font-semibold leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {voc ? voc.title : ''}
        </div>
      </div>

      {/* Body */}
      <div
        className={
          isFullscreen ? 'flex-1 flex overflow-hidden' : 'flex-1 overflow-y-auto px-4 pt-3 pb-4'
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
            onPatch={(patch) => void updateVoc.mutate({ id: voc.id, patch })}
          />
        )}
      </div>
    </div>
  );
}

export default VocReviewPanel;
