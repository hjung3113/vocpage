import * as React from 'react';
import { cn } from '../../lib/utils';

type AlertVariant = 'default' | 'destructive' | 'warning' | 'success';

const variantClasses: Record<AlertVariant, string> = {
  default:
    'border-[color:var(--border-standard)] bg-[color:var(--bg-surface)] text-[color:var(--text-primary)]',
  destructive:
    'border-[color:var(--status-red)] bg-[color:var(--bg-surface)] text-[color:var(--status-red)]',
  warning:
    'border-[color:var(--status-yellow)] bg-[color:var(--bg-surface)] text-[color:var(--status-yellow)]',
  success:
    'border-[color:var(--status-green)] bg-[color:var(--bg-surface)] text-[color:var(--status-green)]',
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'relative w-full rounded-lg border p-4 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
