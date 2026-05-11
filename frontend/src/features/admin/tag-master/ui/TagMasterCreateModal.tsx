/**
 * TagMasterCreateModal — Add new tag (Manager+)
 * 409 CONFLICT shown inline.
 */
import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateTag } from '../api/tag-master.api';
import type { TagKind } from '@contracts/admin/tag';

interface Props {
  onClose: () => void;
}

export function TagMasterCreateModal({ onClose }: Props) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<TagKind>('general');
  const [error, setError] = useState<string | null>(null);
  const createTag = useCreateTag();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    createTag.mutate(
      { name: name.trim(), kind },
      {
        onSuccess: onClose,
        onError: (err) => {
          const e = err as { status?: number; message?: string };
          if (e.status === 409) {
            setError('동일한 이름과 종류의 태그가 이미 존재합니다.');
          } else {
            setError(e.message ?? '오류가 발생했습니다.');
          }
        },
      },
    );
  }

  return (
    <ModalOverlay onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <ModalHeader title="태그 추가" onClose={onClose} />

        <label style={labelStyle}>
          이름
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="태그 이름"
            required
            maxLength={80}
            style={inputStyle}
            data-testid="input-tag-name"
          />
        </label>

        <label style={labelStyle}>
          종류
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as TagKind)}
            style={inputStyle}
            data-testid="select-tag-kind"
          >
            <option value="general">일반</option>
            <option value="menu">메뉴</option>
          </select>
        </label>

        {error && <InlineError message={error} />}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            취소
          </button>
          <button
            type="submit"
            disabled={createTag.isPending || !name.trim()}
            style={submitBtnStyle(createTag.isPending || !name.trim())}
            data-testid="btn-submit-create"
          >
            {createTag.isPending ? '추가 중…' : '추가'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

// ─── Shared modal sub-components ─────────────────────────────────────────────

export function ModalOverlay({
  children,
  onClose,
  maxWidth = '480px',
}: {
  children: React.ReactNode;
  onClose: () => void;
  /** Outer container cap. Wider modals (tag rules) pass e.g. '720px'. */
  maxWidth?: string;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-overlay)',
        zIndex: 50,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-elevated)',
          borderRadius: '8px',
          padding: '24px',
          minWidth: '340px',
          maxWidth,
          width: '100%',
          boxShadow: 'var(--shadow-dialog)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </span>
      <button
        onClick={onClose}
        aria-label="닫기"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '2px',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: '8px 10px',
        borderRadius: '6px',
        background: 'var(--status-red-bg)',
        color: 'var(--status-red)',
        fontSize: '13px',
      }}
    >
      {message}
    </div>
  );
}

export const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-secondary)',
};

export const inputStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: '6px',
  border: '1px solid var(--border-standard)',
  background: 'var(--bg-panel)',
  color: 'var(--text-primary)',
  fontSize: '13px',
};

export const cancelBtnStyle: React.CSSProperties = {
  padding: '7px 14px',
  borderRadius: '6px',
  border: '1px solid var(--border-standard)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: '13px',
  cursor: 'pointer',
};

export const submitBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '7px 14px',
  borderRadius: '6px',
  border: 'none',
  background: disabled ? 'var(--bg-subtle)' : 'var(--accent)',
  color: disabled ? 'var(--text-muted)' : 'var(--bg-elevated)',
  fontSize: '13px',
  fontWeight: 500,
  cursor: disabled ? 'not-allowed' : 'pointer',
});
