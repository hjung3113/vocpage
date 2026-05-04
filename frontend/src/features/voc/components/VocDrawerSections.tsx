import type { InternalNote, VocHistoryEntry } from '../../../../../shared/contracts/voc';
import type { Role } from '../../../../../shared/contracts/common';
import { VocAttachmentsPanel, VocHistoryPanel, type AttachmentItem } from './VocReviewSections';
import { VocCommentList } from './VocCommentList';
import { VocInternalNotes } from './VocInternalNotes';

interface Props {
  currentUserId: string;
  role: Role;
  isOwner: boolean;
  canWrite: boolean;
  canUpload: boolean;
  pending: boolean;
  notes: InternalNote[] | undefined;
  notesLoading: boolean;
  attachments: AttachmentItem[];
  historyEntries: VocHistoryEntry[] | undefined;
  historyLoading: boolean;
  onAddNote: (body: string) => void;
}

export function VocDrawerSections({
  currentUserId,
  role,
  isOwner,
  canWrite,
  canUpload,
  pending,
  notes,
  notesLoading,
  attachments,
  historyEntries,
  historyLoading,
  onAddNote,
}: Props) {
  return (
    <div className="flex flex-col gap-4" data-pcomp="voc-review-sections">
      {/* TODO(FU): wire api/comments + react-query mutations. C-14 ships UI only. */}
      <VocCommentList
        comments={[]}
        currentUserId={currentUserId}
        canWrite={canWrite}
        pending={pending}
        onAdd={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />
      <VocInternalNotes
        notes={notes}
        notesLoading={notesLoading}
        pending={pending}
        role={role}
        isOwner={isOwner}
        onAdd={onAddNote}
      />
      <VocAttachmentsPanel items={attachments} canUpload={canUpload} />
      <VocHistoryPanel entries={historyEntries} loading={historyLoading} />
    </div>
  );
}
