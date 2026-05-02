import type { LucideIcon } from 'lucide-react';

export interface OutlineChipProps {
  label: string;
  icon?: LucideIcon | '#';
  size?: 'sm';
}

export function OutlineChip({ label, icon }: OutlineChipProps) {
  return (
    <span
      data-testid="outline-chip"
      className="inline-flex items-center whitespace-nowrap"
      style={{
        background: 'var(--brand-bg)',
        color: 'var(--accent)',
        border: '1px solid var(--brand-border)',
        borderRadius: 'var(--chip-radius-pill)',
        padding: '2px var(--chip-padding-x-sm)',
        height: 'var(--chip-height-sm)',
        gap: 'var(--chip-gap)',
        fontSize: 'var(--chip-font-size-sm)',
        fontWeight: 600,
      }}
    >
      {icon === '#' ? (
        <span aria-hidden="true">#</span>
      ) : icon ? (
        (() => {
          const Icon = icon as LucideIcon;
          return <Icon aria-hidden size={12} />;
        })()
      ) : null}
      {label}
    </span>
  );
}
