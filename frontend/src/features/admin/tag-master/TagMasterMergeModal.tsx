/**
 * TagMasterMergeModal — Merge source tag into target (Admin only)
 * Atomic: voc_tags + tag_rules rewired, source hard-deleted.
 * 409/404/400 shown inline.
 */
import { useState } from 'react';
import { useMergeTag } from './api';
import {
  ModalOverlay,
  ModalHeader,
  InlineError,
  labelStyle,
  inputStyle,
  cancelBtnStyle,
  submitBtnStyle,
} from './TagMasterCreateModal';
import type { TagMasterItem } from '../../../../../shared/contracts/admin/tag';

interface Props {
  source: TagMasterItem;
  allTags: TagMasterItem[];
  onClose: () => void;
}

export function TagMasterMergeModal({ source, allTags, onClose }: Props) {
  const [targetId, setTargetId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mergeTag = useMergeTag();

  const candidates = allTags.filter((t) => t.id !== source.id && t.kind === source.kind);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetId) return;
    setError(null);
    mergeTag.mutate(
      { id: source.id, targetId },
      {
        onSuccess: onClose,
        onError: (err) => {
          const e = err as { status?: number; message?: string };
          setError(e.message ?? '병합 중 오류가 발생했습니다.');
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
        <ModalHeader title="태그 병합" onClose={onClose} />

        <div
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'var(--bg-subtle)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>"{source.name}"</strong>의 VOC 및 규칙을
          아래 대상 태그로 이전 후 원본 태그를 삭제합니다.
          <br />
          <span style={{ color: 'var(--status-red)', fontSize: '12px' }}>
            이 작업은 취소할 수 없습니다.
          </span>
        </div>

        <label style={labelStyle}>
          대상 태그
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            required
            style={inputStyle}
            data-testid="select-merge-target"
          >
            <option value="">-- 대상 선택 --</option>
            {candidates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.usage_count}건)
              </option>
            ))}
          </select>
        </label>

        {error && <InlineError message={error} />}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            취소
          </button>
          <button
            type="submit"
            disabled={mergeTag.isPending || !targetId}
            style={{
              ...submitBtnStyle(mergeTag.isPending || !targetId),
              background:
                mergeTag.isPending || !targetId ? 'var(--bg-subtle)' : 'var(--status-red)',
            }}
            data-testid="btn-submit-merge"
          >
            {mergeTag.isPending ? '병합 중…' : '병합 실행'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
