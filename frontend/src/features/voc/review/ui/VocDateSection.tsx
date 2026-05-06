import type { Voc } from '@contracts/voc/entity';
import type { VocUpdate } from '@contracts/voc';
import { VocSection } from './VocSection';
import { PropRow } from '@features/voc/shared/ui/PropRow';
import { EditableDatePicker } from '@features/voc/shared/ui/EditableDatePicker';

export interface VocDateSectionProps {
  voc: Partial<Voc>;
  editable?: boolean;
  onPatch?: (patch: VocUpdate) => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export function VocDateSection({ voc, editable = false, onPatch }: VocDateSectionProps) {
  return (
    <VocSection title="일정" testId="voc-date-panel">
      <div data-pcomp="VocDateSection">
        <PropRow label="등록일" testId="meta-created_at">
          {voc.created_at ? formatDate(voc.created_at) : '— (자동 설정)'}
        </PropRow>
        <PropRow label="마감일" testId="meta-due_date">
          {editable ? (
            <EditableDatePicker
              value={voc.due_date ? voc.due_date.slice(0, 10) : null}
              disabled={!editable}
              onChange={(v) => {
                const iso = v ? `${v}T00:00:00.000Z` : null;
                onPatch?.({ due_date: iso });
              }}
              placeholder="날짜 선택"
            />
          ) : (
            formatDate(voc.due_date)
          )}
        </PropRow>
      </div>
    </VocSection>
  );
}

export default VocDateSection;
