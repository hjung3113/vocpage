/**
 * TagMasterRow — single row in the Tag Master table.
 * Extracted to keep TagMasterTable under the 200-line limit.
 */
import { Lock, Pencil, GitMerge, Trash2 } from 'lucide-react';
import { TagMasterActionButton } from './TagMasterActionButton';
import type { TagMasterItem } from '@contracts/admin/tag';

interface Props {
  tag: TagMasterItem;
  isAdmin: boolean;
  canMutate: boolean;
  onEdit: (tag: TagMasterItem) => void;
  onMerge: (tag: TagMasterItem) => void;
  onOpenRules: (tag: TagMasterItem) => void;
  onDelete: (tag: TagMasterItem) => void;
  onToggleExternal: (tag: TagMasterItem) => void;
}

export function TagMasterRow({
  tag,
  isAdmin,
  canMutate,
  onEdit,
  onMerge,
  onOpenRules,
  onDelete,
  onToggleExternal,
}: Props) {
  const ruleCount = tag.rule_ref_count;
  return (
    <tr style={{ borderBottom: '1px solid var(--border-standard)' }}>
      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{tag.name}</td>
      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
        {tag.kind === 'general' ? '일반' : '메뉴'}
      </td>
      <td style={{ padding: '10px 12px' }}>
        <button
          onClick={() => isAdmin && onToggleExternal(tag)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Admin 전용' : tag.is_external ? '외부잠금 해제' : '외부잠금 설정'}
          style={{
            padding: '2px 8px',
            borderRadius: '4px',
            border: `1px solid ${tag.is_external ? 'var(--status-red)' : 'var(--border-standard)'}`,
            background: tag.is_external ? 'var(--status-red-bg)' : 'transparent',
            color: tag.is_external ? 'var(--status-red)' : 'var(--text-muted)',
            fontSize: '11px',
            cursor: isAdmin ? 'pointer' : 'not-allowed',
          }}
          data-testid={`btn-external-${tag.id}`}
        >
          <Lock size={10} aria-hidden style={{ marginRight: '3px' }} />
          {tag.is_external ? '잠금' : '미잠금'}
        </button>
      </td>
      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{tag.usage_count}</td>
      <td style={{ padding: '10px 12px' }}>
        <button
          type="button"
          onClick={() => onOpenRules(tag)}
          aria-label={`${tag.name}의 규칙 ${ruleCount}건 관리`}
          data-testid={`btn-open-rules-${tag.id}`}
          className={ruleCount === 0 ? undefined : 'tag-rule-row-badge'}
          style={
            ruleCount === 0
              ? {
                  background: 'transparent',
                  border: 'none',
                  padding: '2px 0',
                  cursor: 'pointer',
                  color: 'var(--text-quaternary)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                }
              : {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--sp-1)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  border: '1px solid var(--brand-border)',
                  background: 'var(--brand-bg)',
                  color: 'var(--accent)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }
          }
        >
          {ruleCount === 0 ? '규칙 없음' : `규칙 ${ruleCount}건`}
        </button>
      </td>
      <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: '12px' }}>
        {tag.created_at.slice(0, 10)}
      </td>
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 'var(--sp-1)', flexWrap: 'wrap' }}>
          <TagMasterActionButton
            icon={<Pencil size={13} />}
            label="편집"
            enabled={canMutate}
            onClick={() => onEdit(tag)}
            testId={`btn-edit-${tag.id}`}
          />
          <TagMasterActionButton
            icon={<GitMerge size={13} />}
            label="병합"
            enabled={isAdmin}
            onClick={() => onMerge(tag)}
            testId={`btn-merge-${tag.id}`}
          />
          <TagMasterActionButton
            icon={<Trash2 size={13} />}
            label="삭제"
            enabled={isAdmin}
            onClick={() => onDelete(tag)}
            variant="danger"
            testId={`btn-delete-${tag.id}`}
          />
        </div>
      </td>
    </tr>
  );
}
