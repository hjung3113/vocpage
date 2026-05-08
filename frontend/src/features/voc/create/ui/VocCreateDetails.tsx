import type { VocPriority, VocStatus } from '@contracts/voc/entity';
import type { VocTypeListItem } from '@contracts/master/io';
import { EditableSelect } from '@features/voc/shared/ui/EditableSelect';
import { VocStatusBadge, VocPriorityBadge, VocTypeBadge } from '@entities/voc';

interface IdLabel {
  id: string;
  label: string;
}

const STATUS_OPTIONS = [
  { id: '접수', label: '접수' },
  { id: '검토중', label: '검토중' },
  { id: '처리중', label: '처리중' },
  { id: '완료', label: '완료' },
  { id: '드랍', label: '드랍' },
];

export interface VocCreateDetailsProps {
  status: VocStatus;
  priority: VocPriority;
  voc_type_id: string | undefined;
  system_id: string | undefined;
  menu_id: string | undefined;
  assignee_id: string | null;
  vocTypes: VocTypeListItem[];
  systems: IdLabel[];
  menus: IdLabel[];
  menuDisabled?: boolean;
  assignees: IdLabel[];
  onChange: (
    patch: Partial<{
      status: VocStatus;
      priority: VocPriority;
      voc_type_id: string;
      system_id: string;
      menu_id: string;
      assignee_id: string | null;
    }>,
  ) => void;
}

export function VocCreateDetails({
  status,
  priority,
  voc_type_id,
  system_id,
  menu_id,
  assignee_id,
  vocTypes,
  systems,
  menus,
  menuDisabled = false,
  assignees,
  onChange,
}: VocCreateDetailsProps) {
  const vocTypeMap = Object.fromEntries(
    vocTypes.map((t) => [t.id, { slug: t.slug, name: t.name }]),
  );
  const activeType = voc_type_id ? vocTypeMap[voc_type_id] : undefined;

  const systemOptions = systems.map((s) => ({ id: s.id, label: s.label }));
  const menuOptions = menus.map((m) => ({ id: m.id, label: m.label }));
  const assigneeOptions = assignees.map((a) => ({ id: a.id, label: a.label }));

  return (
    <div
      className="w-60 shrink-0 overflow-y-auto px-4 py-4 flex flex-col gap-3"
      style={{
        borderLeft: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}
    >
      <DetailRow label="상태">
        <EditableSelect
          value={status}
          options={STATUS_OPTIONS}
          onChange={(v) => onChange({ status: v as VocStatus })}
          searchable={false}
          renderTrigger={() => <VocStatusBadge status={status} />}
        />
      </DetailRow>

      {assigneeOptions.length > 0 && (
        <DetailRow label="담당자">
          <EditableSelect
            value={assignee_id}
            options={assigneeOptions}
            onChange={(v) => onChange({ assignee_id: v })}
            placeholder="—"
          />
        </DetailRow>
      )}

      {/* 2×2 grid: 시스템 / 메뉴 / 유형 / 우선순위 */}
      <div data-testid="voc-create-details-grid" className="grid grid-cols-2 gap-3">
        <DetailRow label="시스템">
          {systemOptions.length > 0 ? (
            <EditableSelect
              value={system_id ?? null}
              options={systemOptions}
              onChange={(v) => onChange({ system_id: v ?? undefined })}
              searchable={false}
              placeholder="—"
            />
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
          )}
        </DetailRow>

        <DetailRow label="메뉴">
          {menuDisabled ? (
            <div
              data-testid="voc-create-menu-disabled"
              aria-disabled="true"
              className="rounded px-2 py-1 text-[12px]"
              style={{
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-quaternary)',
                background: 'var(--bg-app)',
              }}
              title="시스템을 먼저 선택하세요"
            >
              시스템을 먼저 선택
            </div>
          ) : menuOptions.length > 0 ? (
            <EditableSelect
              value={menu_id ?? null}
              options={menuOptions}
              onChange={(v) => onChange({ menu_id: v ?? undefined })}
              searchable={false}
              placeholder="—"
            />
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
          )}
        </DetailRow>

        <DetailRow label="유형">
          <EditableSelect
            value={voc_type_id ?? null}
            options={vocTypes.map((t) => ({ id: t.id, label: t.name }))}
            onChange={(v) => onChange({ voc_type_id: v ?? undefined })}
            placeholder="—"
            renderTrigger={() =>
              activeType ? (
                <VocTypeBadge slug={activeType.slug} name={activeType.name} />
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
              )
            }
          />
        </DetailRow>

        {/* feature-voc.md §8.4 — priority 항상 'medium', read-only */}
        <DetailRow label="우선순위">
          <div
            data-testid="voc-create-priority-locked"
            aria-readonly="true"
            className="flex items-center gap-2"
            title="등록 시 보통(medium)으로 자동 설정. 등록 후 드로어에서 변경하세요."
          >
            <VocPriorityBadge priority={priority} />
            <span className="text-[10.5px]" style={{ color: 'var(--text-quaternary)' }}>
              자동
            </span>
          </div>
        </DetailRow>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span
        className="text-[10.5px] font-semibold uppercase tracking-[0.07em]"
        style={{ color: 'var(--text-quaternary)', fontFamily: 'var(--font-ui)' }}
      >
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
