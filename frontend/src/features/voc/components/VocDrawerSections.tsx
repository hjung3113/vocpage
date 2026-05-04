import type { InternalNote, VocHistoryEntry } from '../../../../../shared/contracts/voc';
import type { Role } from '../../../../../shared/contracts/common';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs';
import { VocHistoryPanel } from './VocReviewSections';
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
  pending: boolean;
  notes: InternalNote[] | undefined;
  notesLoading: boolean;
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
  pending,
  notes,
  notesLoading,
  historyEntries,
  historyLoading,
  onAddNote,
}: Props) {
  return (
    <Tabs defaultValue="comment" data-pcomp="voc-review-sections">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="comment">댓글</TabsTrigger>
        <TabsTrigger value="internal">내부노트</TabsTrigger>
        <TabsTrigger value="history">변경이력</TabsTrigger>
        <TabsTrigger value="subtask">서브태스크</TabsTrigger>
      </TabsList>

      <TabsContent value="comment">
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
      </TabsContent>

      <TabsContent value="internal">
        <VocInternalNotes
          notes={notes}
          notesLoading={notesLoading}
          pending={pending}
          role={role}
          isOwner={isOwner}
          onAdd={onAddNote}
        />
      </TabsContent>

      <TabsContent value="history">
        <VocHistoryPanel entries={historyEntries} loading={historyLoading} />
      </TabsContent>

      <TabsContent value="subtask">
        {/* TODO(FU): wire subtask CRUD + onOpen navigation. C-16 ships UI only. */}
        <VocSubTaskList
          parentId={vocId}
          parentIsSubtask={parentIsSubtask}
          subs={[]}
          canAdd={canWrite}
          onOpen={() => {}}
          onAdd={() => {}}
        />
      </TabsContent>
    </Tabs>
  );
}
