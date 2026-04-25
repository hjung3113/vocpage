interface TagChipProps {
  name: string;
  source?: 'manual' | 'rule';
  onRemove?: () => void;
}

export function TagChip({ name, onRemove }: TagChipProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '12px',
        background: 'color-mix(in srgb, var(--brand) 12%, transparent)',
        color: 'var(--text-primary)',
        border: '1px solid color-mix(in srgb, var(--brand) 30%, transparent)',
      }}
    >
      {name}
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`${name} 태그 제거`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            lineHeight: 1,
            color: 'var(--text-secondary)',
            fontSize: '11px',
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
