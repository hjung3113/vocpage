import type { Voc } from '@contracts/voc/entity';
import { VocSection } from './VocSection';
import { VocStatusBadge, VocPriorityBadge, VocTypeBadge, VocTagPill } from '@entities/voc';

export interface VocDetailSectionProps {
  voc: Voc;
  vocTypeMap?: Record<string, { slug: string; name: string }>;
  systemMap?: Record<string, string>;
  menuMap?: Record<string, string>;
  tags?: string[];
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

export function VocDetailSection({
  voc,
  vocTypeMap,
  systemMap,
  menuMap,
  tags,
}: VocDetailSectionProps) {
  const vocType = vocTypeMap?.[voc.voc_type_id];
  const systemLabel = systemMap?.[voc.system_id] ?? '—';
  const menuLabel = menuMap?.[voc.menu_id] ?? '—';
  const tagList = tags ?? [];

  return (
    <VocSection title="정보" testId="voc-detail-panel">
      <div
        data-pcomp="VocDetailSection"
        className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md px-3 py-3"
      >
        <MetaField label="시스템" testId="meta-system">
          <span style={VALUE_STYLE}>{systemLabel}</span>
        </MetaField>

        <MetaField label="메뉴" testId="meta-menu">
          <span style={VALUE_STYLE}>{menuLabel}</span>
        </MetaField>

        <MetaField label="우선순위" testId="meta-priority">
          <VocPriorityBadge priority={voc.priority} />
        </MetaField>

        <MetaField label="상태" testId="meta-status">
          <VocStatusBadge status={voc.status} />
        </MetaField>

        <MetaField label="유형" testId="meta-type">
          {vocType ? (
            <VocTypeBadge slug={vocType.slug} name={vocType.name} />
          ) : (
            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>—</span>
          )}
        </MetaField>

        <MetaField label="태그" testId="meta-tags">
          {tagList.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tagList.map((tag) => (
                <VocTagPill key={tag} name={tag} />
              ))}
            </div>
          ) : (
            <span style={VALUE_STYLE}>—</span>
          )}
        </MetaField>
      </div>
    </VocSection>
  );
}

export default VocDetailSection;
