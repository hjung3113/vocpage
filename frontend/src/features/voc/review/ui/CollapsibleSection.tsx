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
      className="flex flex-col gap-2"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-1.5 text-left">
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform duration-150',
            !open && '-rotate-90',
          )}
          style={{ color: 'var(--text-secondary)' }}
        />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
