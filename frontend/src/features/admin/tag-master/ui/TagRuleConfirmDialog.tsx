/**
 * TagRuleConfirmDialog — destructive-action confirmation gate.
 *
 * Phase 01 Plan 06. Used by TagRulesManagerModal for delete / suspend / resume.
 * Threat T-01-15: Admin-only mutations require explicit confirmation per
 * 01-UI-SPEC.md §Destructive actions matrix.
 */
import type { CSSProperties } from 'react';

export type TagRuleConfirmKind = 'delete' | 'suspend' | 'resume';

interface Copy {
  body: string;
  primary: string;
  destructive: boolean;
}

const COPY: Record<TagRuleConfirmKind, Copy> = {
  delete: {
    body: '이 규칙을 삭제하시겠습니까? 삭제된 규칙은 복구할 수 없습니다.',
    primary: '삭제',
    destructive: true,
  },
  suspend: {
    body: '이 규칙을 일시중지하시겠습니까? 일시중지된 규칙은 신규 VOC에 자동 적용되지 않습니다.',
    primary: '일시중지',
    destructive: false,
  },
  resume: {
    body: '이 규칙을 재개하시겠습니까? 재개 후 신규 VOC부터 자동 태깅에 다시 사용됩니다.',
    primary: '재개',
    destructive: false,
  },
};

const ghostBtn: CSSProperties = {
  padding: '7px 14px',
  borderRadius: '6px',
  border: '1px solid var(--border-standard)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: '13px',
  cursor: 'pointer',
};

const primaryBtn: CSSProperties = {
  padding: '7px 14px',
  borderRadius: '6px',
  border: 'none',
  background: 'var(--accent)',
  color: 'var(--text-on-brand, var(--bg-elevated))',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
};

const destructiveBtn: CSSProperties = {
  padding: '7px 14px',
  borderRadius: '6px',
  border: '1px solid var(--status-red-border)',
  background: 'var(--status-red)',
  color: 'var(--text-on-brand, var(--bg-elevated))',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
};

export function TagRuleConfirmDialog({
  kind,
  pending,
  onCancel,
  onConfirm,
}: {
  kind: TagRuleConfirmKind;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const copy = COPY[kind];
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: 'var(--bg-elevated)',
          borderRadius: '8px',
          padding: 'var(--sp-5)',
          minWidth: '340px',
          maxWidth: '420px',
          boxShadow: 'var(--shadow-dialog)',
        }}
      >
        <p
          style={{
            margin: '0 0 var(--sp-4)',
            fontSize: '13.5px',
            color: 'var(--text-primary)',
            lineHeight: 1.5,
          }}
        >
          {copy.body}
        </p>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onCancel} disabled={pending} style={ghostBtn}>
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            style={{
              ...(copy.destructive ? destructiveBtn : primaryBtn),
              cursor: pending ? 'not-allowed' : 'pointer',
            }}
          >
            {copy.primary}
          </button>
        </div>
      </div>
    </div>
  );
}
