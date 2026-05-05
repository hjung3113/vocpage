import type { Voc } from '../../../../../../shared/contracts/voc/entity';
import { VocSection } from './VocSection';
import { VocAssignee } from '@entities/voc';

export interface VocPeopleSectionProps {
  voc: Voc;
  assigneeMap: Record<string, string>;
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  marginBottom: '2px',
};

function MetaField({
  label,
  testId,
  children,
}: {
  label: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={LABEL_STYLE}>{label}</span>
      <div data-testid={testId}>{children}</div>
    </div>
  );
}

export function VocPeopleSection({ voc, assigneeMap }: VocPeopleSectionProps) {
  const assigneeName = voc.assignee_id ? (assigneeMap[voc.assignee_id] ?? null) : null;
  const authorName = assigneeMap[voc.author_id] ?? null;

  return (
    <VocSection title="인원" testId="voc-people-panel">
      <div
        data-pcomp="VocPeopleSection"
        className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md px-3 py-3"
        style={{ background: 'var(--bg-surface)' }}
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
