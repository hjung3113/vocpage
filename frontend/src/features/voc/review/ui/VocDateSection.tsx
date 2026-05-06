import type { Voc } from '@contracts/voc/entity';
import { VocSection } from './VocSection';

export interface VocDateSectionProps {
  voc: Voc;
}

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
    <div
      className="flex items-center gap-3 py-1.5 min-h-[26px]"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <span className="w-16 shrink-0 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      <div
        data-testid={testId}
        className="text-xs font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {children}
      </div>
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
      <div data-pcomp="VocDateSection" className="flex flex-col">
        <MetaField label="등록일" testId="meta-created_at">
          {formatDate(voc.created_at)}
        </MetaField>
        <MetaField label="마감일" testId="meta-due_date">
          {formatDate(voc.due_date)}
        </MetaField>
      </div>
    </VocSection>
  );
}

export default VocDateSection;
