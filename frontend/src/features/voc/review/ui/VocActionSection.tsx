import type { InternalNote, VocHistoryEntry } from '@contracts/voc';
import { CollapsibleSection } from './CollapsibleSection';
import type { Role } from '@contracts/common';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/ui/tabs';
import { VocHistory } from './VocHistory';
import { VocComment } from './VocComment';
import { VocInternalNotes } from './VocInternalNotes';
import { VocSubTask } from './VocSubTask';
import { LoadingState } from '@shared/ui/skeleton';
import { useVocComments, useVocSubtasks } from '../model/useDrawerQueries';

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
  const comments = useVocComments(vocId);
  const subtasks = useVocSubtasks(vocId);
  return (
    <CollapsibleSection title="활동" testId="drawer-actions">
      <Tabs defaultValue="comment" data-pcomp="review-sections">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="comment">
            Comment
          </TabsTrigger>
          <TabsTrigger variant="underline" value="history">
            History
          </TabsTrigger>
          <TabsTrigger variant="underline" value="subtask">
            Subtask
          </TabsTrigger>
          {canSeeInternal && (
            <TabsTrigger variant="underline" value="internal">
              InternalNote
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="comment">
          {comments.isLoading ? (
            <LoadingState />
          ) : (
            <VocComment
              comments={comments.data ?? []}
              currentUserId={currentUserId}
              canWrite={canWrite}
              pending={pending}
              onAdd={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
            />
          )}
        </TabsContent>

        <TabsContent value="history" data-testid="drawer-history">
          <VocHistory entries={historyEntries} loading={historyLoading} />
        </TabsContent>

        <TabsContent value="subtask">
          {subtasks.isLoading ? (
            <LoadingState />
          ) : (
            <VocSubTask
              parentId={vocId}
              parentIsSubtask={parentIsSubtask}
              subs={subtasks.data ?? []}
              canAdd={canWrite}
              onOpen={() => {}}
              onAdd={() => {}}
            />
          )}
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
