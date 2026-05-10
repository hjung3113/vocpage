/**
 * TagMasterSuspendModal — Suspend/resume a tag rule (Admin only)
 * suspended_until = null → resume immediately.
 */
import { useState } from 'react';
import { useSuspendTagRule } from '../api/tag-master.api';
import {
  ModalOverlay,
  ModalHeader,
  InlineError,
  labelStyle,
  inputStyle,
  cancelBtnStyle,
  submitBtnStyle,
} from './TagMasterCreateModal';

interface Props {
  ruleId: string;
  currentValue: string | null;
  onClose: () => void;
}

export function TagMasterSuspendModal({ ruleId, currentValue, onClose }: Props) {
  const [suspendUntil, setSuspendUntil] = useState<string>(
    currentValue ? currentValue.slice(0, 16) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const suspendRule = useSuspendTagRule();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const value = suspendUntil.trim() ? new Date(suspendUntil).toISOString() : null;
    suspendRule.mutate(
      { id: ruleId, suspended_until: value },
      {
        onSuccess: onClose,
        onError: (err) => {
          const e = err as { message?: string };
          setError(e.message ?? '오류가 발생했습니다.');
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
        <ModalHeader title="규칙 일시중지" onClose={onClose} />

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          일시중지 종료 시각을 입력하세요. 비워두면 즉시 재개됩니다.
        </p>

        <label style={labelStyle}>
          일시중지 종료 시각
          <input
            type="datetime-local"
            value={suspendUntil}
            onChange={(e) => setSuspendUntil(e.target.value)}
            style={inputStyle}
            data-testid="input-suspend-until"
          />
        </label>

        {error && <InlineError message={error} />}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle}>
            취소
          </button>
          <button
            type="submit"
            disabled={suspendRule.isPending}
            style={submitBtnStyle(suspendRule.isPending)}
            data-testid="btn-submit-suspend"
          >
            {suspendRule.isPending ? '저장 중…' : suspendUntil ? '일시중지' : '즉시 재개'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}
