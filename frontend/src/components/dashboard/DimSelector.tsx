import './DimSelector.css';

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
    <div className="dim-selector">
      {options.map((opt) => {
        const isHidden = hiddenValues.includes(opt.value);
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={isHidden}
            style={isHidden ? { display: 'none' } : undefined}
            className={`dim-selector-btn${isActive ? ' active' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
