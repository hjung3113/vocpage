import type { LucideIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { badgeVariants } from './Badge';

export interface OutlineChipProps {
  label: string;
  icon?: LucideIcon | '#';
  size?: 'sm';
}

export function OutlineChip({ label, icon }: OutlineChipProps) {
  return (
    <span
      data-testid="outline-chip"
      className={cn(
        badgeVariants({ chipVariant: 'outline' }),
        'text-[length:var(--chip-font-size-sm)]',
      )}
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
