/**
 * TagRuleConfirmDialog — destructive-action confirmation gate.
 *
 * Phase 01 Plan 06. Used by TagRulesManagerModal for delete / suspend / resume.
 * Threat T-01-15: Admin-only mutations require explicit confirmation per
 * 01-UI-SPEC.md §Destructive actions matrix.
 *
 * Implemented on @radix-ui/react-alert-dialog so focus-trap, Escape handler,
 * outside-click suppression for destructive intent, and aria-labelledby /
 * aria-describedby wiring come from the primitive (UI-SPEC §Registry Safety).
 */
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { CSSProperties } from 'react';

export type TagRuleConfirmKind = 'delete' | 'suspend' | 'resume';

interface Copy {
  title: string;
  body: string;
  primary: string;
  destructive: boolean;
}

const COPY: Record<TagRuleConfirmKind, Copy> = {
  delete: {
    title: '규칙 삭제',
    body: '이 규칙을 삭제하시겠습니까? 삭제된 규칙은 복구할 수 없습니다.',
    primary: '삭제',
    destructive: true,
  },
  suspend: {
    title: '규칙 일시중지',
    body: '이 규칙을 일시중지하시겠습니까? 일시중지된 규칙은 신규 VOC에 자동 적용되지 않습니다.',
    primary: '일시중지',
    destructive: false,
  },
  resume: {
    title: '규칙 재개',
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

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'var(--bg-overlay)',
  zIndex: 60,
};

const contentStyle: CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  background: 'var(--bg-elevated)',
  borderRadius: '8px',
  padding: 'var(--sp-5)',
  minWidth: '340px',
  maxWidth: '420px',
  boxShadow: 'var(--shadow-dialog)',
  zIndex: 60,
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
    <AlertDialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !pending) onCancel();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay style={overlayStyle} />
        <AlertDialog.Content style={contentStyle}>
          <AlertDialog.Title
            style={{
              margin: '0 0 var(--sp-2)',
              fontSize: '14.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {copy.title}
          </AlertDialog.Title>
          <AlertDialog.Description
            style={{
              margin: '0 0 var(--sp-4)',
              fontSize: '13.5px',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
            }}
          >
            {copy.body}
          </AlertDialog.Description>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>
            <AlertDialog.Cancel asChild>
              <button type="button" disabled={pending} style={ghostBtn}>
                취소
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={(e) => {
                  // Action triggers onConfirm; the parent decides when to close.
                  // Prevent Radix's default close so a pending mutation stays
                  // visible behind the dialog rather than flashing closed.
                  if (pending) {
                    e.preventDefault();
                    return;
                  }
                  onConfirm();
                }}
                disabled={pending}
                style={{
                  ...(copy.destructive ? destructiveBtn : primaryBtn),
                  cursor: pending ? 'not-allowed' : 'pointer',
                }}
              >
                {copy.primary}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
