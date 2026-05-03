import type { InternalNote, VocHistoryEntry } from '../../../../../shared/contracts/voc';
import type { Role } from '../../../../../shared/contracts/common';
import { VocAttachmentsPanel, VocHistoryPanel, type AttachmentItem } from './VocReviewSections';
import { VocCommentList } from './VocCommentList';
import { VocInternalNotes } from './VocInternalNotes';
import { VocSubTaskList } from './VocSubTaskList';

interface Props {
  vocId: string;
  parentIsSubtask: boolean;
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
  vocId,
  parentIsSubtask,
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
      <VocHistoryPanel entries={historyEntries} loading={historyLoading} />
      {/* TODO(FU): wire subtask CRUD + onOpen navigation. C-16 ships UI only. */}
      <VocSubTaskList
        parentId={vocId}
        parentIsSubtask={parentIsSubtask}
        subs={[]}
        canAdd={canWrite}
        onOpen={() => {}}
        onAdd={() => {}}
      />
      <VocAttachmentsPanel items={attachments} canUpload={canUpload} />
      <VocInternalNotes
        notes={notes}
        notesLoading={notesLoading}
        pending={pending}
        role={role}
        isOwner={isOwner}
        onAdd={onAddNote}
      />
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
    </div>
  );
}
