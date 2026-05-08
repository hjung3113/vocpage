import type { Voc } from '@contracts/voc/entity';
import type { InternalNote, VocUpdate } from '@contracts/voc';
import type { Role } from '@contracts/common';
import type { AttachmentItem } from './VocAttachmentSection';
import { VocActionSection } from './VocActionSection';
import { VocDetailSection } from './VocDetailSection';
import { VocPeopleSection } from './VocPeopleSection';
import { VocDateSection } from './VocDateSection';
import { VocBodySection } from './VocBodySection';
import { VocAttachmentSection } from './VocAttachmentSection';
import { CollapsibleSection } from './CollapsibleSection';

export interface VocDrawerBodyProps {
  voc: Voc;
  isFullscreen: boolean;
  attachments: AttachmentItem[];
  assigneeMap: Record<string, string>;
  vocTypeMap?: Record<string, { slug: string; name: string }>;
  systemMap?: Record<string, string>;
  menuMap?: Record<string, string>;
  tags?: string[];
  currentUserId: string;
  role: Role;
  isOwner: boolean;
  canWrite: boolean;
  canUpload: boolean;
  canSeeInternal: boolean;
  pending: boolean;
  notes: InternalNote[] | undefined;
  notesLoading: boolean;
  onAddNote: (body: string) => void;
  onPatch?: (patch: VocUpdate) => void;
}

export function VocDrawerBody({
  voc,
  isFullscreen,
  attachments,
  assigneeMap,
  vocTypeMap,
  systemMap,
  menuMap,
  tags,
  currentUserId,
  role,
  isOwner,
  canWrite,
  canUpload,
  canSeeInternal,
  pending,
  notes,
  notesLoading,
  onAddNote,
  onPatch,
}: VocDrawerBodyProps) {
  const detailProps = { voc, vocTypeMap, systemMap, menuMap, tags, editable: canWrite, onPatch };
  const actionProps = {
    vocId: voc.id,
    parentIsSubtask: voc.parent_id !== null,
    currentUserId,
    role,
    isOwner,
    canWrite,
    canSeeInternal,
    pending,
    notes,
    notesLoading,
    onAddNote,
  };

  const metaSection = (
    <CollapsibleSection title="정보" noBorder>
      <VocDetailSection {...detailProps} />
      <VocPeopleSection voc={voc} assigneeMap={assigneeMap} editable={canWrite} onPatch={onPatch} />
      <VocDateSection voc={voc} editable={canWrite} onPatch={onPatch} />
    </CollapsibleSection>
  );

  if (isFullscreen) {
    return (
      <>
        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-6 flex flex-col gap-6 min-w-0">
          <VocBodySection body={voc.body} />
          <VocAttachmentSection items={attachments} canUpload={canUpload} />
          <VocActionSection {...actionProps} />
        </div>
        <div
          className="w-64 shrink-0 overflow-y-auto pt-6 pb-6 px-5 flex flex-col gap-4"
          style={{ borderLeft: '1px solid var(--border-subtle)' }}
        >
          {metaSection}
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {metaSection}
      <VocBodySection body={voc.body} />
      <VocAttachmentSection items={attachments} canUpload={canUpload} noBorder />
      <VocActionSection {...actionProps} />
      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
    </div>
  );
}
