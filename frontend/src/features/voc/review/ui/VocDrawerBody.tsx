import type { Voc } from '@contracts/voc/entity';
import type { InternalNote } from '@contracts/voc';
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
}: VocDrawerBodyProps) {
  const detailProps = { voc, vocTypeMap, systemMap, menuMap, tags };
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

  if (isFullscreen) {
    return (
      <>
        <div className="flex-1 overflow-y-auto px-8 pt-4 pb-4 flex flex-col gap-4">
          <CollapsibleSection title="본문">
            <VocBodySection body={voc.body} />
          </CollapsibleSection>
          <VocActionSection {...actionProps} />
        </div>
        <div
          className="w-72 shrink-0 overflow-y-auto pt-4 pb-4 px-5 flex flex-col"
          style={{ borderLeft: '1px solid var(--border-subtle)' }}
        >
          <CollapsibleSection title="상세 정보">
            <VocDetailSection {...detailProps} />
          </CollapsibleSection>
          <CollapsibleSection title="담당자">
            <VocPeopleSection voc={voc} assigneeMap={assigneeMap} />
          </CollapsibleSection>
          <CollapsibleSection title="날짜">
            <VocDateSection voc={voc} />
          </CollapsibleSection>
          <VocAttachmentSection items={attachments} canUpload={canUpload} />
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CollapsibleSection title="상세 정보">
        <VocDetailSection {...detailProps} />
      </CollapsibleSection>
      <CollapsibleSection title="담당자">
        <VocPeopleSection voc={voc} assigneeMap={assigneeMap} />
      </CollapsibleSection>
      <CollapsibleSection title="날짜">
        <VocDateSection voc={voc} />
      </CollapsibleSection>
      <CollapsibleSection title="본문">
        <VocBodySection body={voc.body} />
      </CollapsibleSection>
      <VocAttachmentSection items={attachments} canUpload={canUpload} />
      <VocActionSection {...actionProps} />
    </div>
  );
}
