import type { Voc } from '@contracts/voc/entity';
import type { VocUpdate } from '@contracts/voc';
import { VocSection } from './VocSection';
import { VocAssignee } from '@entities/voc';
import { PropRow } from '@features/voc/shared/ui/PropRow';
import { EditableSelect } from '@features/voc/shared/ui/EditableSelect';

export interface VocPeopleSectionProps {
  voc: Partial<Voc>;
  assigneeMap: Record<string, string>;
  editable?: boolean;
  onPatch?: (patch: VocUpdate) => void;
}

export function VocPeopleSection({
  voc,
  assigneeMap,
  editable = false,
  onPatch,
}: VocPeopleSectionProps) {
  const assigneeName = voc.assignee_id ? (assigneeMap[voc.assignee_id] ?? null) : null;
  const authorName = voc.author_id ? (assigneeMap[voc.author_id] ?? null) : null;

  const assigneeOptions = Object.entries(assigneeMap).map(([id, label]) => ({ id, label }));

  return (
    <VocSection title="인원" testId="voc-people-panel">
      <div data-pcomp="VocPeopleSection">
        <PropRow label="담당자" testId="meta-assignee">
          {editable ? (
            <EditableSelect
              value={voc.assignee_id ?? null}
              options={assigneeOptions}
              disabled={!editable}
              onChange={(v) => onPatch?.({ assignee_id: v })}
              placeholder="—"
              renderTrigger={() => <VocAssignee name={assigneeName} />}
            />
          ) : (
            <VocAssignee name={assigneeName} />
          )}
        </PropRow>
        <PropRow label="작성자" testId="meta-author">
          {voc.author_id ? (
            <VocAssignee name={authorName} />
          ) : (
            <span style={{ color: 'var(--text-quaternary)' }}>— (자동 설정)</span>
          )}
        </PropRow>
      </div>
    </VocSection>
  );
}

export default VocPeopleSection;
