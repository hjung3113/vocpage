import type { Voc } from '../../../../../shared/contracts/voc/entity';
import { VocStatusBadge } from '../../../components/voc/VocStatusBadge';
import { VocPriorityBadge } from '../../../components/voc/VocPriorityBadge';
import { VocTypeBadge } from '../../../components/voc/VocTypeBadge';
import { VocAssignee } from '../../../components/voc/VocAssignee';

export interface VocReviewMetaPanelProps {
  voc: Voc;
  assigneeMap: Record<string, string>;
  vocTypeMap?: Record<string, { slug: string; name: string }>;
  systemMap?: Record<string, string>;
  menuMap?: Record<string, string>;
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

export function VocReviewMetaPanel({
  voc,
  assigneeMap,
  vocTypeMap,
  systemMap,
  menuMap,
}: VocReviewMetaPanelProps) {
  const vocType = vocTypeMap?.[voc.voc_type_id];
  const assigneeName = voc.assignee_id ? (assigneeMap[voc.assignee_id] ?? null) : null;
  const systemLabel = systemMap?.[voc.system_id] ?? '—';
  const menuLabel = menuMap?.[voc.menu_id] ?? '—';

  return (
    <div
      data-testid="voc-meta-panel"
      data-pcomp="VocReviewMetaPanel"
      className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md px-3 py-3"
      style={{ background: 'var(--bg-surface)' }}
    >
      <MetaField label="상태" testId="meta-status">
        <VocStatusBadge status={voc.status} />
      </MetaField>

      <MetaField label="우선순위" testId="meta-priority">
        <VocPriorityBadge priority={voc.priority} />
      </MetaField>

      <MetaField label="유형" testId="meta-type">
        {vocType ? (
          <VocTypeBadge slug={vocType.slug} name={vocType.name} />
        ) : (
          <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>—</span>
        )}
      </MetaField>

      <MetaField label="담당자" testId="meta-assignee">
        <VocAssignee name={assigneeName} />
      </MetaField>

      <MetaField label="마감일" testId="meta-due_date">
        <span style={VALUE_STYLE}>{formatDate(voc.due_date)}</span>
      </MetaField>

      <MetaField label="시스템" testId="meta-system">
        <span style={VALUE_STYLE}>{systemLabel}</span>
      </MetaField>

      <MetaField label="메뉴" testId="meta-menu">
        <span style={VALUE_STYLE}>{menuLabel}</span>
      </MetaField>
    </div>
  );
}

export default VocReviewMetaPanel;
