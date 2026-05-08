import type { InternalNote } from '@contracts/voc';
import type { Role } from '@contracts/common';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/ui/tabs';
import { VocHistory } from './VocHistory';
import { VocActivityTimeline } from './VocActivityTimeline';
import { VocComment } from './VocComment';
import { VocInternalNotes } from './VocInternalNotes';
import { VocSubTask } from './VocSubTask';
import { LoadingState } from '@shared/ui/skeleton';
import { useVocComments, useVocSubtasks, useVocHistory } from '../model/useDrawerQueries';

interface Props {
  vocId: string;
  parentIsSubtask: boolean;
  currentUserId: string;
  role: Role;
  isOwner: boolean;
  canWrite: boolean;
  canSeeInternal: boolean;
  pending: boolean;
  // notes/onAddNote stay as props: mutation ownership lives in the parent (VocReviewDrawer)
  notes: InternalNote[] | undefined;
  notesLoading: boolean;
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
  onAddNote,
}: Props) {
  const comments = useVocComments(vocId);
  const subtasks = useVocSubtasks(vocId);
  // history is read-only; fetching is co-located here alongside comments/subtasks
  const history = useVocHistory(vocId);
  return (
    <div data-testid="drawer-actions">
      <Tabs defaultValue="comment" data-testid="review-sections">
        <TabsList variant="underline">
          <TabsTrigger variant="underline" value="comment">
            댓글
          </TabsTrigger>
          <TabsTrigger variant="underline" value="history">
            이력
          </TabsTrigger>
          <TabsTrigger variant="underline" value="activity">
            활동
          </TabsTrigger>
          <TabsTrigger variant="underline" value="subtask">
            하위작업
          </TabsTrigger>
          {canSeeInternal && (
            <TabsTrigger variant="underline" value="internal">
              내부메모
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
          <VocHistory entries={history.data} loading={history.isLoading} />
        </TabsContent>

        <TabsContent value="activity" data-testid="drawer-activity">
          <VocActivityTimeline
            history={history.data}
            comments={comments.data}
            loading={history.isLoading || comments.isLoading}
          />
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
    </div>
  );
}
