import type { Voc } from '@contracts/voc/entity';
import { VocSection } from './VocSection';
import { VocAssignee } from '@entities/voc';

export interface VocPeopleSectionProps {
  voc: Voc;
  assigneeMap: Record<string, string>;
}

function PropRow({
  label,
  testId,
  children,
}: {
  label: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-center gap-3 py-1.5 min-h-[26px]"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <span className="w-16 shrink-0 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      <div data-testid={testId} className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

export function VocPeopleSection({ voc, assigneeMap }: VocPeopleSectionProps) {
  const assigneeName = voc.assignee_id ? (assigneeMap[voc.assignee_id] ?? null) : null;
  const authorName = assigneeMap[voc.author_id] ?? null;

  return (
    <VocSection title="인원" testId="voc-people-panel">
      <div data-pcomp="VocPeopleSection" className="grid grid-cols-2 gap-x-6">
        <PropRow label="담당자" testId="meta-assignee">
          <VocAssignee name={assigneeName} />
        </PropRow>
        <PropRow label="작성자" testId="meta-author">
          <VocAssignee name={authorName} />
        </PropRow>
      </div>
    </VocSection>
  );
}

export default VocPeopleSection;
