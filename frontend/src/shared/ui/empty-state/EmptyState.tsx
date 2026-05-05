import type { LucideIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { Button } from '@shared/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}
    >
      {Icon && (
        <Icon size={40} className="text-[color:var(--text-secondary)] opacity-50" aria-hidden />
      )}
      <p className="text-sm font-medium text-[color:var(--text-primary)]">{title}</p>
      {description && (
        <p className="max-w-xs text-xs text-[color:var(--text-secondary)]">{description}</p>
      )}
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}
