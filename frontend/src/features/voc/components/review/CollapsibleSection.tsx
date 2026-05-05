import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@shared/lib/cn';

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
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section data-testid={testId} className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <h3 className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          {title}
        </h3>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 transition-transform duration-150',
            !isOpen && '-rotate-90',
          )}
          style={{ color: 'var(--text-secondary)' }}
        />
      </button>
      {isOpen && children}
    </section>
  );
}
