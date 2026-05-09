import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-[color:var(--bg-app)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[color:var(--brand)] text-[color:var(--text-on-brand)] hover:bg-[color:var(--accent-hover)]',
        destructive: 'bg-[color:var(--danger)] text-[color:var(--text-on-brand)] hover:opacity-90',
        outline:
          'border border-[color:var(--border-standard)] bg-[color:var(--bg-app)] hover:bg-[color:var(--bg-elevated)] hover:text-[color:var(--text-primary)]',
        secondary:
          'bg-[color:var(--bg-elevated)] text-[color:var(--text-primary)] hover:opacity-80',
        ghost: 'hover:bg-[color:var(--bg-elevated)] hover:text-[color:var(--text-primary)]',
        link: 'text-[color:var(--brand)] underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-[var(--ui-h-sm)] px-[var(--ui-px-sm)] rounded-md',
        md: 'h-[var(--ui-h-md)] px-[var(--ui-px-md)] rounded-md',
        lg: 'h-[var(--ui-h-lg)] px-[var(--ui-px-lg)] rounded-md',
        icon: 'h-[var(--ui-h-md)] w-[var(--ui-h-md)] rounded-md',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
