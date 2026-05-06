import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/lib/cn';

export const badgeVariants = cva('inline-flex items-center whitespace-nowrap font-semibold', {
  variants: {
    chipVariant: {
      // Dynamic colors via inline style — only structural classes here
      status:
        'rounded-[var(--chip-radius-pill)] h-[var(--chip-height-sm)] px-[var(--chip-padding-x-sm)] py-0.5 gap-[var(--chip-gap)]',
      // Static brand colors via Tailwind classes
      outline:
        'rounded-[var(--chip-radius-pill)] h-[var(--chip-height-sm)] px-[var(--chip-padding-x-sm)] py-0.5 gap-[var(--chip-gap)] bg-[color:var(--brand-bg)] text-[color:var(--accent)] border border-[color:var(--brand-border)]',
      // Text mark: only layout; font-size/height handled by inline style (test requirement)
      text: 'gap-[var(--chip-gap)]',
    },
  },
});

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, BadgeVariantProps {}

export function Badge({ className, chipVariant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ chipVariant }), className)} {...props} />;
}
