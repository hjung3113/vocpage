import type { InternalNote, VocHistoryEntry } from '@contracts/voc';
import { CollapsibleSection } from './CollapsibleSection';
import type { Role } from '@contracts/common';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/ui/tabs';
import { VocHistory } from './VocHistory';
import { VocComment } from './VocComment';
import { VocInternalNotes } from './VocInternalNotes';
import { VocSubTask } from './VocSubTask';

interface Props {
  vocId: string;
  parentIsSubtask: boolean;
  currentUserId: string;
  role: Role;
  isOwner: boolean;
  canWrite: boolean;
  canSeeInternal: boolean;
  pending: boolean;
  notes: InternalNote[] | undefined;
  notesLoading: boolean;
  historyEntries: VocHistoryEntry[] | undefined;
  historyLoading: boolean;
  onAddNote: (body: string) => void;
}

export function VocActionSection({
  vocId,
  parentIsSubtask,
  currentUserId,
  role,
  isOwner,
  canWrite,
  canSeeInternal,
  pending,
  notes,
  notesLoading,
  historyEntries,
  historyLoading,
  onAddNote,
}: Props) {
  return (
    <CollapsibleSection title="활동" testId="drawer-actions">
      <Tabs defaultValue="comment" data-pcomp="review-sections">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="comment">Comment</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="subtask">Subtask</TabsTrigger>
          {canSeeInternal && <TabsTrigger value="internal">InternalNote</TabsTrigger>}
        </TabsList>

        <TabsContent value="comment">
          {/* TODO(FU): wire api/comments + react-query mutations. C-14 ships UI only. */}
          <VocComment
            comments={[]}
            currentUserId={currentUserId}
            canWrite={canWrite}
            pending={pending}
            onAdd={() => {}}
            onEdit={() => {}}
            onDelete={() => {}}
          />
        </TabsContent>

        <TabsContent value="history">
          <VocHistory entries={historyEntries} loading={historyLoading} />
        </TabsContent>

        <TabsContent value="subtask">
          {/* TODO(FU): wire subtask CRUD + onOpen navigation. C-16 ships UI only. */}
          <VocSubTask
            parentId={vocId}
            parentIsSubtask={parentIsSubtask}
            subs={[]}
            canAdd={canWrite}
            onOpen={() => {}}
            onAdd={() => {}}
          />
        </TabsContent>

        {canSeeInternal && (
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
        )}
      </Tabs>
    </CollapsibleSection>
  );
}
