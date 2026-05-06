import type { Voc } from '@contracts/voc/entity';
import type { VocUpdate } from '@contracts/voc';
import { VocSection } from './VocSection';
import { VocStatusBadge, VocPriorityBadge, VocTypeBadge, VocTagPill } from '@entities/voc';
import { PropRow } from '@features/voc/shared/ui/PropRow';
import { EditableSelect } from '@features/voc/shared/ui/EditableSelect';

export interface VocDetailSectionProps {
  voc: Partial<Voc>;
  editable?: boolean;
  onPatch?: (patch: VocUpdate) => void;
  vocTypeMap?: Record<string, { slug: string; name: string }>;
  systemMap?: Record<string, string>;
  menuMap?: Record<string, string>;
  tags?: string[];
}

function opts(...pairs: [string, string][]): { id: string; label: string }[] {
  return pairs.map(([id, label]) => ({ id, label }));
}

const STATUS_OPTIONS = opts(
  ['접수', '접수'],
  ['검토중', '검토중'],
  ['처리중', '처리중'],
  ['완료', '완료'],
  ['드랍', '드랍'],
);
const PRIORITY_OPTIONS = opts(
  ['urgent', '긴급'],
  ['high', '높음'],
  ['medium', '보통'],
  ['low', '낮음'],
);
const REVIEW_STATUS_OPTIONS = opts(
  ['unverified', '미검토'],
  ['approved', '승인'],
  ['rejected', '거부'],
  ['pending_deletion', '삭제 대기'],
);
const RESOLUTION_QUALITY_OPTIONS = opts(['근본해결', '근본해결'], ['임시조치', '임시조치']);
const DROP_REASON_OPTIONS = opts(
  ['중복', '중복'],
  ['정책거부', '정책거부'],
  ['재현불가', '재현불가'],
  ['범위외', '범위외'],
  ['기타', '기타'],
);

export function VocDetailSection({
  voc,
  editable = false,
  onPatch,
  vocTypeMap,
  systemMap,
  menuMap,
  tags,
}: VocDetailSectionProps) {
  const vocType = voc.voc_type_id ? vocTypeMap?.[voc.voc_type_id] : undefined;
  const systemLabel = voc.system_id ? (systemMap?.[voc.system_id] ?? '—') : '—';
  const menuLabel = voc.menu_id ? (menuMap?.[voc.menu_id] ?? '—') : '—';
  const tagList = tags ?? [];

  const systemOptions = systemMap
    ? Object.entries(systemMap).map(([id, label]) => ({ id, label }))
    : [];
  const menuOptions = menuMap ? Object.entries(menuMap).map(([id, label]) => ({ id, label })) : [];
  const vocTypeOptions = vocTypeMap
    ? Object.entries(vocTypeMap).map(([id, { name }]) => ({ id, label: name }))
    : [];

  function patch(p: VocUpdate) {
    if (editable) onPatch?.(p);
  }

  return (
    <VocSection title="분류" testId="voc-detail-panel">
      <div data-pcomp="VocDetailSection">
        <PropRow label="시스템" testId="meta-system">
          {editable && systemOptions.length > 0 ? (
            <EditableSelect
              value={voc.system_id ?? null}
              options={systemOptions}
              disabled={!editable}
              onChange={(v) => patch({ system_id: v })}
              searchable={false}
              placeholder="—"
            />
          ) : (
            systemLabel
          )}
        </PropRow>
        <PropRow label="메뉴" testId="meta-menu">
          {editable && menuOptions.length > 0 ? (
            <EditableSelect
              value={voc.menu_id ?? null}
              options={menuOptions}
              disabled={!editable}
              onChange={(v) => patch({ menu_id: v })}
              searchable={false}
              placeholder="—"
            />
          ) : (
            menuLabel
          )}
        </PropRow>
        <PropRow label="우선순위" testId="meta-priority">
          {editable ? (
            <EditableSelect
              value={voc.priority ?? null}
              options={PRIORITY_OPTIONS}
              disabled={!editable}
              onChange={(v) => patch({ priority: v as Voc['priority'] })}
              searchable={false}
              placeholder="—"
              renderTrigger={
                voc.priority ? () => <VocPriorityBadge priority={voc.priority!} /> : undefined
              }
            />
          ) : voc.priority ? (
            <VocPriorityBadge priority={voc.priority} />
          ) : (
            <span style={{ color: 'var(--text-quaternary)' }}>—</span>
          )}
        </PropRow>
        <PropRow label="상태" testId="meta-status">
          {editable ? (
            <EditableSelect
              value={voc.status ?? null}
              options={STATUS_OPTIONS}
              disabled={!editable}
              onChange={(v) => patch({ status: v as Voc['status'] })}
              searchable={false}
              placeholder="—"
              renderTrigger={voc.status ? () => <VocStatusBadge status={voc.status!} /> : undefined}
            />
          ) : voc.status ? (
            <VocStatusBadge status={voc.status} />
          ) : (
            <span style={{ color: 'var(--text-quaternary)' }}>—</span>
          )}
        </PropRow>
        <PropRow label="유형" testId="meta-type">
          {editable && vocTypeOptions.length > 0 ? (
            <EditableSelect
              value={voc.voc_type_id ?? null}
              options={vocTypeOptions}
              disabled={!editable}
              onChange={(v) => patch({ voc_type_id: v })}
              placeholder="—"
              renderTrigger={() =>
                vocType ? (
                  <VocTypeBadge slug={vocType.slug} name={vocType.name} />
                ) : (
                  <span style={{ color: 'var(--text-quaternary)' }}>—</span>
                )
              }
            />
          ) : vocType ? (
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
        <PropRow label="검토상태" testId="meta-review_status">
          {editable ? (
            <EditableSelect
              value={voc.review_status ?? null}
              options={REVIEW_STATUS_OPTIONS}
              disabled={!editable}
              onChange={(v) => patch({ review_status: v as NonNullable<Voc['review_status']> })}
              searchable={false}
              placeholder="—"
            />
          ) : (
            <span style={{ color: 'var(--text-quaternary)' }}>{voc.review_status ?? '—'}</span>
          )}
        </PropRow>
        <PropRow label="해결품질" testId="meta-resolution_quality">
          {editable ? (
            <EditableSelect
              value={voc.resolution_quality ?? null}
              options={RESOLUTION_QUALITY_OPTIONS}
              disabled={!editable}
              onChange={(v) =>
                patch({ resolution_quality: v as NonNullable<Voc['resolution_quality']> })
              }
              searchable={false}
              placeholder="—"
            />
          ) : (
            <span style={{ color: 'var(--text-quaternary)' }}>{voc.resolution_quality ?? '—'}</span>
          )}
        </PropRow>
        <PropRow label="드랍사유" testId="meta-drop_reason">
          {editable ? (
            <EditableSelect
              value={voc.drop_reason ?? null}
              options={DROP_REASON_OPTIONS}
              disabled={!editable}
              onChange={(v) => patch({ drop_reason: v as NonNullable<Voc['drop_reason']> })}
              searchable={false}
              placeholder="—"
            />
          ) : (
            <span style={{ color: 'var(--text-quaternary)' }}>{voc.drop_reason ?? '—'}</span>
          )}
        </PropRow>
      </div>
    </VocSection>
  );
}

export default VocDetailSection;
