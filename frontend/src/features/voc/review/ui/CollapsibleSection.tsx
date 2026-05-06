import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@shared/ui/collapsible';

interface CollapsibleSectionProps {
  title: string;
  testId?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  testId,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      data-testid={testId}
      className="flex flex-col"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between gap-2 text-left py-2.5 rounded-sm transition-colors',
          'hover:bg-muted/40',
          !open && 'bg-muted/20',
        )}
      >
        <span
          className="text-[11px] font-semibold tracking-[0.07em] uppercase"
          style={{ color: 'var(--text-secondary)' }}
        >
          {title}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
            !open && '-rotate-90',
          )}
          style={{ color: open ? 'var(--text-quaternary)' : 'var(--text-secondary)' }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}
