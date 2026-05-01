import { cn } from '../../lib/utils';

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label, className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-label={label ?? '로딩 중'}
      className={cn('flex flex-col items-center justify-center gap-3 py-16', className)}
    >
      <span
        className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--brand)] border-t-transparent"
        aria-hidden
      />
      {label && <p className="text-xs text-[color:var(--text-secondary)]">{label}</p>}
    </div>
  );
}
