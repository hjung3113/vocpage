interface Option {
  label: string;
  value: string;
}

interface DimSelectorProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  hiddenValues?: string[];
}

export function DimSelector({ options, value, onChange, hiddenValues = [] }: DimSelectorProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1px',
        background: 'var(--bg-elevated)',
        borderRadius: '5px',
        padding: '2px',
      }}
    >
      {options.map((opt) => {
        const isHidden = hiddenValues.includes(opt.value);
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={isHidden}
            style={{
              display: isHidden ? 'none' : undefined,
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: isActive ? 600 : 500,
              border: 'none',
              background: isActive ? 'var(--bg-surface)' : 'transparent',
              color: isActive ? 'var(--brand)' : 'var(--text-quaternary)',
              borderRadius: '3px',
              cursor: isHidden ? 'not-allowed' : 'pointer',
              opacity: isHidden ? 0.35 : undefined,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
