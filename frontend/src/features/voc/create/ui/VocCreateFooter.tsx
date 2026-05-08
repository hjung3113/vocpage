interface VocCreateFooterProps {
  createAnother: boolean;
  onCreateAnotherChange: (checked: boolean) => void;
  submitting: boolean;
  onCancel: () => void;
}

export function VocCreateFooter({
  createAnother,
  onCreateAnotherChange,
  submitting,
  onCancel,
}: VocCreateFooterProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 shrink-0"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={createAnother}
          onChange={(e) => onCreateAnotherChange(e.target.checked)}
          aria-label="연속 등록"
          className="rounded"
        />
        <span
          className="text-xs"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-ui)' }}
        >
          연속 등록
        </span>
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            border: '1px solid var(--border-standard)',
            background: 'transparent',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          취소
        </button>
        <button
          type="submit"
          form="voc-create-dialog-form"
          disabled={submitting}
          className="rounded px-3 py-1.5 text-xs font-medium transition-opacity"
          style={{
            background: 'var(--brand)',
            color: 'var(--text-on-brand)',
            fontFamily: 'var(--font-ui)',
            opacity: submitting ? 0.5 : 1,
          }}
        >
          {submitting ? '등록 중...' : '등록'}
        </button>
      </div>
    </div>
  );
}
