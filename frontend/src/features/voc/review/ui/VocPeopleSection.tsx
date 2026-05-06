import type { Voc } from '@contracts/voc/entity';
import { VocSection } from './VocSection';
import { VocAssignee } from '@entities/voc';
import { MetaField } from '@shared/ui/meta-field';

export interface VocPeopleSectionProps {
  voc: Voc;
  assigneeMap: Record<string, string>;
}

export function VocPeopleSection({ voc, assigneeMap }: VocPeopleSectionProps) {
  const assigneeName = voc.assignee_id ? (assigneeMap[voc.assignee_id] ?? null) : null;
  const authorName = assigneeMap[voc.author_id] ?? null;

  return (
    <VocSection title="인원" testId="voc-people-panel">
      <div
        data-pcomp="VocPeopleSection"
        className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md px-3 py-3"
      >
        <MetaField label="담당자" testId="meta-assignee">
          <VocAssignee name={assigneeName} />
        </MetaField>

        <MetaField label="작성자" testId="meta-author">
          <VocAssignee name={authorName} />
        </MetaField>
      </div>
    </VocSection>
  );
}

export default VocPeopleSection;
