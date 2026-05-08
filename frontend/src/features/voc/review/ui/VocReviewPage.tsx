import { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useRole } from '@entities/user/model/useRole';
import { useVocPermissions } from '../model/useVocPermissions';
import { useUpdateVoc } from '@features/voc/model/useVocMutation';
import { useVocDetailByCode } from '../model/useDrawerQueries';
import { AuthContext } from '@features/auth/model/AuthContext';
import { VocPermissionGate } from './VocPermissionGate';
import { LoadingState } from '@shared/ui/skeleton';
import { ErrorState } from '@shared/ui/error-state';
import { VocDrawerBody } from './VocDrawerBody';
import { VocStatusBadge, VocPriorityBadge } from '@entities/voc';
import { PayloadReviewActions } from './PayloadReviewActions';

const EMPTY_ASSIGNEE_MAP: Record<string, string> = {};

export function VocReviewPage() {
  const { id: issueCode = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useRole();
  const { canWrite, canUpload, canSeeInternal } = useVocPermissions();
  const auth = useContext(AuthContext);
  const updateVoc = useUpdateVoc();
  const detail = useVocDetailByCode(issueCode || null);

  const voc = detail.data;
  const isDeleted = !!voc?.deleted_at;
  const blockedDeleted = isDeleted && role !== 'admin';
  const canReview = role === 'manager' || role === 'admin';

  return (
    <div
      data-testid="voc-review-page"
      className="flex flex-col h-full"
      style={{ background: 'var(--bg-panel)' }}
    >
      {/* Header */}
      <div
        className="px-4 pt-3 pb-2.5 shrink-0 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={() => navigate('/voc')}
          className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-[color:var(--bg-hover)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--brand)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft className="h-4 w-4" />
          목록
        </button>
        {voc && (
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-semibold"
              style={{
                fontFamily: 'D2Coding, monospace',
                background: 'var(--brand-bg)',
                color: 'var(--accent)',
              }}
            >
              {voc.issue_code}
            </span>
            <VocStatusBadge status={voc.status} iconOnly />
            <VocPriorityBadge priority={voc.priority} iconOnly />
            <span
              className="text-[13px] font-semibold leading-snug truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {voc.title}
            </span>
          </div>
        )}
        {voc && canReview && !blockedDeleted && (
          <PayloadReviewActions vocId={voc.id} onReviewed={() => void detail.refetch()} />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {detail.isLoading && (
          <div className="flex-1 px-6 pt-4">
            <LoadingState />
          </div>
        )}
        {detail.isError && (
          <div className="flex-1 px-6 pt-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(detail.error as any)?.response?.status === 403 ? (
              <VocPermissionGate reason="role" />
            ) : (
              <ErrorState />
            )}
          </div>
        )}
        {voc && blockedDeleted && (
          <div className="flex-1 px-6 pt-4">
            <VocPermissionGate reason="deleted" />
          </div>
        )}
        {voc && !blockedDeleted && (
          <VocDrawerBody
            voc={voc}
            isFullscreen={true}
            attachments={[]}
            assigneeMap={EMPTY_ASSIGNEE_MAP}
            currentUserId={auth?.user?.id ?? ''}
            role={role}
            isOwner={!!auth?.user?.id && voc.assignee_id === auth.user.id}
            canWrite={canWrite}
            canUpload={canUpload}
            canSeeInternal={canSeeInternal}
            pending={updateVoc.isPending}
            notes={undefined}
            notesLoading={false}
            onAddNote={() => {}}
            onPatch={(patch) => void updateVoc.mutate({ id: voc.id, patch })}
          />
        )}
      </div>
    </div>
  );
}

export default VocReviewPage;
