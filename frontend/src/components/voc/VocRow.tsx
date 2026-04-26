import { ChevronDown, ChevronRight, CornerDownRight, UserMinus } from 'lucide-react';
import type { VocSummary } from '../../api/vocs';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';

interface VocRowProps {
  voc: VocSummary;
  isChild?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  isLoadingChildren?: boolean;
  onToggleExpand?: () => void;
  onClick: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

const AVATAR_COLORS = [
  { bg: 'var(--brand)', text: 'var(--text-on-brand)' },
  { bg: 'var(--status-green)', text: 'var(--text-on-brand)' },
  { bg: 'var(--status-purple)', text: 'var(--text-on-brand)' },
  { bg: 'var(--status-amber)', text: 'var(--text-on-brand)' },
  { bg: 'var(--status-red)', text: 'var(--text-on-brand)' },
  { bg: 'var(--status-emerald)', text: 'var(--text-on-brand)' },
];

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getTypeBadgeStyle(typeName: string | null) {
  if (!typeName) return null;
  const n = typeName;
  if (n.includes('버그') || n.includes('오류'))
    return {
      bg: 'var(--status-red-bg)',
      border: 'var(--status-red-border)',
      color: 'var(--status-red)',
    };
  if (n.includes('기능') || n.includes('요청'))
    return { bg: 'var(--brand-bg)', border: 'var(--brand-border)', color: 'var(--brand)' };
  if (n.includes('개선') || n.includes('제안') || n.includes('계산'))
    return {
      bg: 'var(--status-amber-bg)',
      border: 'var(--status-amber-border)',
      color: 'var(--status-amber)',
    };
  if (n.includes('문의'))
    return {
      bg: 'var(--status-purple-bg)',
      border: 'var(--status-purple-border)',
      color: 'var(--status-purple)',
    };
  return {
    bg: 'var(--bg-elevated)',
    border: 'var(--border-subtle)',
    color: 'var(--text-tertiary)',
  };
}

function AssigneeCell({ name }: { name: string | null }) {
  if (!name) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          color: 'var(--text-quaternary)',
        }}
      >
        <UserMinus size={13} />
        미배정
      </span>
    );
  }
  const { bg, text } = avatarColor(name);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
      <span
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: bg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 700,
          color: text,
          flexShrink: 0,
        }}
      >
        {name.charAt(0)}
      </span>
      <span
        className="truncate"
        style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: 0 }}
      >
        {name}
      </span>
    </span>
  );
}

export function VocRow({
  voc,
  isChild = false,
  hasChildren = false,
  isExpanded = false,
  isLoadingChildren = false,
  onToggleExpand,
  onClick,
}: VocRowProps) {
  const typeBadge = getTypeBadgeStyle(voc.voc_type_name ?? null);
  const titleColor = isChild ? 'var(--text-secondary)' : 'var(--text-primary)';

  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        background: isChild ? 'color-mix(in srgb, var(--bg-surface) 62%, transparent)' : undefined,
      }}
      className="hover:bg-[var(--bg-surface)] transition-colors"
    >
      {/* 이슈 ID */}
      <td
        className="px-3 py-2.5 text-xs"
        style={{
          fontFamily: 'var(--font-code)',
          color: isChild ? 'var(--text-tertiary)' : 'var(--text-secondary)',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {isChild ? (
            <span
              aria-hidden="true"
              style={{
                width: '22px',
                display: 'inline-flex',
                justifyContent: 'center',
                color: 'var(--text-quaternary)',
                flexShrink: 0,
              }}
            >
              <CornerDownRight size={14} />
            </span>
          ) : (
            <button
              type="button"
              aria-label={isExpanded ? 'Sub-task 접기' : 'Sub-task 펼치기'}
              aria-expanded={hasChildren ? isExpanded : undefined}
              disabled={!hasChildren}
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpand?.();
              }}
              style={{
                width: '22px',
                height: '22px',
                border: 0,
                padding: 0,
                borderRadius: '4px',
                background: 'transparent',
                color: hasChildren ? 'var(--text-tertiary)' : 'var(--text-quaternary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: hasChildren ? 'pointer' : 'default',
                opacity: hasChildren ? 1 : 0.35,
                flexShrink: 0,
              }}
            >
              {isLoadingChildren ? (
                <span
                  aria-hidden="true"
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: 'var(--text-quaternary)',
                  }}
                />
              ) : isExpanded ? (
                <ChevronDown size={15} />
              ) : (
                <ChevronRight size={15} />
              )}
            </button>
          )}
          <span className="truncate">{voc.issue_code ?? '—'}</span>
        </span>
      </td>

      {/* 제목 (type badge + title + tags) */}
      <td
        className="px-3 py-2.5"
        style={{ minWidth: 0, paddingLeft: isChild ? '28px' : undefined }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            alignItems: 'center',
            gap: '12px',
            minWidth: 0,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: 0,
            }}
          >
            {typeBadge && voc.voc_type_name && (
              <span
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: typeBadge.bg,
                  border: `1px solid ${typeBadge.border}`,
                  color: typeBadge.color,
                  whiteSpace: 'nowrap',
                  lineHeight: '18px',
                }}
              >
                {voc.voc_type_name}
              </span>
            )}
            <span
              className="truncate"
              style={{
                color: titleColor,
                fontSize: '14px',
                fontWeight: isChild ? 500 : 600,
                lineHeight: 1.45,
                minWidth: 0,
              }}
            >
              {voc.title}
            </span>
          </span>
          {voc.tags && voc.tags.length > 0 && (
            <span
              style={{
                display: 'inline-flex',
                justifyContent: 'flex-end',
                gap: '4px',
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              {voc.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </span>
          )}
        </div>
      </td>

      {/* 상태 */}
      <td className="px-2 py-2.5" style={{ whiteSpace: 'nowrap' }}>
        <StatusBadge status={voc.status} />
      </td>

      {/* 담당자 */}
      <td className="px-2 py-2.5" style={{ whiteSpace: 'nowrap', minWidth: 0 }}>
        <AssigneeCell name={voc.assignee_name ?? null} />
      </td>

      {/* 우선순위 */}
      <td className="px-2 py-2.5" style={{ whiteSpace: 'nowrap' }}>
        <PriorityBadge priority={voc.priority} />
      </td>

      {/* 등록일 */}
      <td
        className="px-3 py-2.5 text-xs"
        style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', paddingRight: '20px' }}
      >
        {formatDate(voc.created_at)}
      </td>
    </tr>
  );
}
