import { Toaster as SonnerToaster, toast } from 'sonner';

/**
 * Token-styled wrapper around sonner's Toaster.
 * Mounting (placement in AppShell) is handled by Wave C.
 */
export function Toaster() {
  return (
    <SonnerToaster
      toastOptions={{
        classNames: {
          toast:
            'bg-[color:var(--bg-surface)] text-[color:var(--text-primary)] border border-[color:var(--border-standard)] shadow-md',
          description: 'text-[color:var(--text-secondary)]',
          actionButton: 'bg-[color:var(--brand)] text-[color:var(--text-on-brand)]',
          cancelButton: 'bg-[color:var(--bg-elevated)] text-[color:var(--text-primary)]',
          error: 'border-[color:var(--status-red-border)]',
          success: 'border-[color:var(--status-green,var(--brand))]',
          warning: 'border-[color:var(--status-amber-border)]',
        },
      }}
    />
  );
}

export { toast };
