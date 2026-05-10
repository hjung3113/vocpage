/**
 * TagMasterEditModal — Rename tag (Manager+)
 * Only `name` mutable; kind locked per spec.
 */
import { useState } from 'react';
import { useRenameTag } from '../api/tag-master.api';
import {
  ModalOverlay,
  ModalHeader,
  InlineError,
  labelStyle,
  inputStyle,
  cancelBtnStyle,
  submitBtnStyle,
} from './TagMasterCreateModal';
import type { TagMasterItem } from '@contracts/admin/tag';

interface Props {
  tag: TagMasterItem;
  onClose: () => void;
}

export function TagMasterEditModal({ tag, onClose }: Props) {
  const [name, setName] = useState(tag.name);
  const [error, setError] = useState<string | null>(null);
  const renameTag = useRenameTag();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    renameTag.mutate(
      { id: tag.id, name: name.trim() },
      {
        onSuccess: onClose,
        onError: (err) => {
          const e = err as { status?: number; message?: string };
          if (e.status === 409) {
            setError('동일한 이름의 태그가 이미 존재합니다.');
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
        <ModalHeader title="태그 편집" onClose={onClose} />

        <label style={labelStyle}>
          이름
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            style={inputStyle}
            data-testid="input-edit-name"
          />
        </label>

        <label style={labelStyle}>
          종류 (변경 불가)
          <input
            value={tag.kind === 'general' ? '일반' : '메뉴'}
            disabled
            style={{ ...inputStyle, color: 'var(--text-muted)' }}
          />
        </label>

        {error && <InlineError message={error} />}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            취소
          </button>
          <button
            type="submit"
            disabled={renameTag.isPending || !name.trim() || name.trim() === tag.name}
            style={submitBtnStyle(renameTag.isPending || !name.trim() || name.trim() === tag.name)}
            data-testid="btn-submit-edit"
          >
            {renameTag.isPending ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
