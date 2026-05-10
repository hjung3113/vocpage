/**
 * TagRulesModalStates — banner / skeleton / empty-state pieces.
 *
 * Phase 01 Plan 06. Extracted from TagRulesManagerModal for file-size discipline.
 * Copy bound to 01-UI-SPEC.md §Copywriting Contract.
 */
import { ListPlus } from 'lucide-react';

export function MutationErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        padding: 'var(--sp-2) var(--sp-3)',
        borderRadius: '6px',
        background: 'var(--status-red-bg)',
        color: 'var(--status-red)',
        border: '1px solid var(--status-red-border)',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: '1px solid var(--status-red-border)',
          color: 'var(--status-red)',
          padding: '3px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        다시 시도
      </button>
    </div>
  );
}

export function RulesSkeletonTable() {
  return (
    <div
      role="status"
      aria-label="규칙 불러오는 중"
      style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          data-testid="rule-skeleton-row"
          style={{ height: '52px', borderRadius: '6px', background: 'var(--bg-elevated)' }}
        />
      ))}
    </div>
  );
}

export function EmptyRulesState() {
  return (
    <div
      style={{
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--sp-2)',
        padding: 'var(--sp-6) var(--sp-4)',
      }}
    >
      <ListPlus size={32} color="var(--text-quaternary)" />
      <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
        등록된 규칙이 없습니다
      </p>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-tertiary)' }}>
        위 폼에서 첫 번째 규칙을 추가하세요
      </p>
    </div>
  );
}
