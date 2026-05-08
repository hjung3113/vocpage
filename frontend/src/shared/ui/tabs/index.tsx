import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/lib/cn';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('inline-flex items-center', {
  variants: {
    variant: {
      default:
        'h-10 justify-center rounded-md bg-[color:var(--bg-elevated)] p-1 text-[color:var(--text-secondary)]',
      underline:
        'w-full justify-start gap-1 rounded-none border-b border-[color:var(--border-subtle)] bg-transparent p-0',
    },
  },
  defaultVariants: { variant: 'default' },
});

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-[color:var(--bg-app)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'rounded-sm px-3 py-1.5 data-[state=active]:bg-[color:var(--bg-surface)] data-[state=active]:text-[color:var(--text-primary)] data-[state=active]:shadow-sm',
        underline:
          'rounded-none border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 text-[color:var(--text-secondary)] shadow-none data-[state=active]:border-[color:var(--brand)] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[color:var(--text-primary)] data-[state=active]:shadow-none',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

type ListVariant = VariantProps<typeof tabsListVariants>['variant'];
type TriggerVariant = VariantProps<typeof tabsTriggerVariants>['variant'];

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: ListVariant }
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { variant?: TriggerVariant }
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-[color:var(--bg-app)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
