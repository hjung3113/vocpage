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
      <div
        data-testid={testId}
        className="flex-1 min-w-0 text-xs font-medium"
        style={{ color: 'var(--text-primary)' }}
      >
        {children}
      </div>
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
      <div data-pcomp="VocDetailSection" className="grid grid-cols-1 @sm:grid-cols-2 gap-x-6">
        <PropRow label="시스템" testId="meta-system">
          {systemLabel}
        </PropRow>
        <PropRow label="메뉴" testId="meta-menu">
          {menuLabel}
        </PropRow>
        <PropRow label="우선순위" testId="meta-priority">
          <VocPriorityBadge priority={voc.priority} />
        </PropRow>
        <PropRow label="상태" testId="meta-status">
          <VocStatusBadge status={voc.status} />
        </PropRow>
        <PropRow label="유형" testId="meta-type">
          {vocType ? (
            <VocTypeBadge slug={vocType.slug} name={vocType.name} />
          ) : (
            <span style={{ color: 'var(--text-quaternary)' }}>—</span>
          )}
        </PropRow>
        <PropRow label="태그" testId="meta-tags">
          {tagList.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tagList.map((tag) => (
                <VocTagPill key={tag} name={tag} />
              ))}
            </div>
          ) : (
            <span style={{ color: 'var(--text-quaternary)' }}>—</span>
          )}
        </PropRow>
      </div>
    </VocSection>
  );
}

export default VocDetailSection;
