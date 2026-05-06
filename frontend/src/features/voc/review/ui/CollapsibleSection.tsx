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
      className="flex flex-col gap-1.5"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 text-left py-2">
        <span
          className="text-[10px] font-semibold tracking-[0.1em] uppercase"
          style={{ color: 'var(--text-quaternary)' }}
        >
          {title}
        </span>
        <ChevronDown
          className={cn(
            'h-3 w-3 shrink-0 transition-transform duration-200',
            !open && '-rotate-90',
          )}
          style={{ color: 'var(--text-quaternary)' }}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
