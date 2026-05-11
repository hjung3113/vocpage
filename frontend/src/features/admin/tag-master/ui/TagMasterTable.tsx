/**
 * TagMasterTable — Tag Master list + action buttons (W3-4)
 *
 * Role guards (ADR 0004 Option D):
 *  - Add / Edit (rename) = Manager+
 *  - Merge / External toggle / Delete / Suspend = Admin only
 *
 * Disabled actions show tooltip "Admin 전용".
 * 409 CONFLICT errors shown inline (not toast).
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRole } from '@entities/user/model/useRole';
import { useAdminTags, useDeleteTag, useToggleExternal } from '../api/tag-master.api';
import { TagMasterCreateModal } from './TagMasterCreateModal';
import { TagMasterEditModal } from './TagMasterEditModal';
import { TagMasterMergeModal } from './TagMasterMergeModal';
import { TagMasterRow } from './TagMasterRow';
import type { TagMasterItem as TagMasterItemT } from '@contracts/admin/tag';

interface Props {
  onOpenRules?: (tag: TagMasterItemT) => void;
}

export function TagMasterTable({ onOpenRules }: Props = {}) {
  const { isAdmin, isManager } = useRole();
  const canMutate = isAdmin || isManager;

  const { data, isLoading, isError, refetch } = useAdminTags();
  const deleteTag = useDeleteTag();
  const toggleExternal = useToggleExternal();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TagMasterItemT | null>(null);
  const [mergeSource, setMergeSource] = useState<TagMasterItemT | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  function handleDelete(tag: TagMasterItemT) {
    setInlineError(null);
    deleteTag.mutate(tag.id, {
      onError: (err) => {
        const e = err as { status?: number; code?: string; message?: string };
        if (e.code === 'CONFLICT' || e.status === 409) {
          setInlineError(`삭제 불가: ${e.message ?? '태그가 사용 중입니다.'}`);
        }
      },
    });
  }

  function handleToggleExternal(tag: TagMasterItemT) {
    setInlineError(null);
    toggleExternal.mutate({ id: tag.id, is_external: !tag.is_external });
  }

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="태그 불러오는 중"
        style={{ padding: 'var(--sp-5)', display: 'flex', flexDirection: 'column', gap: '6px' }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            data-testid="tag-skeleton-row"
            style={{
              height: '40px',
              borderRadius: '6px',
              background: 'var(--bg-elevated)',
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        style={{
          padding: 'var(--sp-5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 'var(--sp-2)',
        }}
      >
        <p style={{ margin: 0, color: 'var(--status-red)', fontSize: '13.5px', fontWeight: 600 }}>
          태그를 불러오지 못했습니다
        </p>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
          네트워크 상태를 확인한 후 다시 시도해 주세요
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--status-red-border)',
            background: 'transparent',
            color: 'var(--status-red)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  const rows = data?.rows ?? [];

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--sp-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              background: 'var(--bg-subtle)',
              borderRadius: '4px',
              padding: '2px 6px',
            }}
          >
            전체 {data?.total ?? 0}건
          </span>
        </div>
        <button
          onClick={() => canMutate && setCreateOpen(true)}
          disabled={!canMutate}
          title={!canMutate ? 'Admin 전용' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            border: 'none',
            cursor: canMutate ? 'pointer' : 'not-allowed',
            background: canMutate ? 'var(--accent)' : 'var(--bg-subtle)',
            color: canMutate ? 'var(--bg-elevated)' : 'var(--text-muted)',
          }}
          data-testid="btn-create-tag"
        >
          <Plus size={14} aria-hidden />
          태그 추가
        </button>
      </div>

      {/* Inline error */}
      {inlineError && (
        <div
          role="alert"
          style={{
            marginBottom: 'var(--sp-3)',
            padding: 'var(--sp-2) var(--sp-3)',
            borderRadius: '6px',
            background: 'var(--status-red-bg)',
            color: 'var(--status-red)',
            fontSize: '13px',
          }}
        >
          {inlineError}
        </div>
      )}

      {/* Table */}
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
          color: 'var(--text-primary)',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-standard)' }}>
            {['이름', '종류', '외부잠금', '사용(VOC)', '규칙 N건', '추가일', '액션'].map((h) => (
              <th
                key={h}
                style={{
                  padding: 'var(--sp-2) var(--sp-3)',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: 'var(--text-muted)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                style={{ padding: 'var(--sp-5) var(--sp-3)', textAlign: 'center', color: 'var(--text-muted)' }}
              >
                태그가 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((tag) => (
              <TagMasterRow
                key={tag.id}
                tag={tag}
                isAdmin={isAdmin}
                canMutate={canMutate}
                onEdit={setEditTarget}
                onMerge={setMergeSource}
                onOpenRules={(t) => onOpenRules?.(t)}
                onDelete={handleDelete}
                onToggleExternal={handleToggleExternal}
              />
            ))
          )}
        </tbody>
      </table>

      {/* Modals */}
      {createOpen && <TagMasterCreateModal onClose={() => setCreateOpen(false)} />}
      {editTarget && <TagMasterEditModal tag={editTarget} onClose={() => setEditTarget(null)} />}
      {mergeSource && (
        <TagMasterMergeModal
          source={mergeSource}
          allTags={rows}
          onClose={() => setMergeSource(null)}
        />
      )}
    </div>
  );
}
