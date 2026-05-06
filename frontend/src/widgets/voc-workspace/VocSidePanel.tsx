import { VocReviewPanel } from '@features/voc/review/ui/VocReviewPanel';
import type { InternalNote } from '@contracts/voc';
import type { AttachmentItem } from '@features/voc/review/ui/VocAttachmentSection';

interface ReviewProps {
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
}

interface VocSidePanelProps {
  review: ReviewProps;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export function VocSidePanel({
  review,
  isFullscreen = false,
  onToggleFullscreen,
}: VocSidePanelProps) {
  return (
    <aside
      data-pcomp="voc-side-panel"
      className="flex flex-col h-full"
      style={{
        width: isFullscreen ? '100%' : '440px',
        flexShrink: 0,
        borderLeft: isFullscreen ? 'none' : '1px solid var(--border-subtle)',
        background: 'var(--bg-panel)',
      }}
    >
      <VocReviewPanel
        vocId={review.vocId}
        notes={review.notes}
        notesLoading={review.notesLoading}
        pending={review.pending}
        attachments={review.attachments}
        assigneeMap={review.assigneeMap}
        vocTypeMap={review.vocTypeMap}
        systemMap={review.systemMap}
        menuMap={review.menuMap}
        tags={review.tags}
        onClose={review.onClose}
        onAddNote={review.onAddNote}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />
    </aside>
  );
}
