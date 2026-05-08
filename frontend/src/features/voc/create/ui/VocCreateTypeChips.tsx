import type { VocTypeListItem } from '@contracts/master/io';

interface VocCreateTypeChipsProps {
  vocTypes: VocTypeListItem[];
  activeTypeId: string | undefined;
  onChange: (id: string) => void;
}

export function VocCreateTypeChips({ vocTypes, activeTypeId, onChange }: VocCreateTypeChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {vocTypes.map((t) => {
        const isActive = activeTypeId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="button"
            aria-pressed={isActive}
            onClick={() => onChange(t.id)}
            className="rounded-full px-3 py-0.5 text-xs font-medium transition-colors"
            style={{
              background: isActive ? 'var(--brand)' : 'var(--bg-hover)',
              color: isActive ? 'var(--text-on-brand)' : 'var(--text-secondary)',
              border: isActive ? 'none' : '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
