import type { Voc } from '../../../../../../shared/contracts/voc/entity';
import { VocSection } from './VocSection';

export interface VocDateSectionProps {
  voc: Voc;
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  marginBottom: '2px',
};

const VALUE_STYLE: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-primary)',
  fontWeight: 500,
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

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

export function VocDateSection({ voc }: VocDateSectionProps) {
  return (
    <VocSection title="일정" testId="voc-date-panel">
      <div
        data-pcomp="VocDateSection"
        className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md px-3 py-3"
        style={{ background: 'var(--bg-surface)' }}
      >
        <MetaField label="등록일" testId="meta-created_at">
          <span style={VALUE_STYLE}>{formatDate(voc.created_at)}</span>
        </MetaField>

        <MetaField label="마감일" testId="meta-due_date">
          <span style={VALUE_STYLE}>{formatDate(voc.due_date)}</span>
        </MetaField>
      </div>
    </VocSection>
  );
}

export default VocDateSection;
