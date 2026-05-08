import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@shared/ui/command';

export interface SelectOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface EditableSelectProps {
  value: string | null;
  options: SelectOption[];
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchable?: boolean;
  renderTrigger?: (selected: SelectOption | null) => React.ReactNode;
}

export function EditableSelect({
  value,
  options,
  onChange,
  disabled = false,
  placeholder = '선택',
  searchable = true,
  renderTrigger,
}: EditableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selected = options.find((o) => o.id === value) ?? null;

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
  }

  const triggerContent = renderTrigger ? (
    renderTrigger(selected)
  ) : (
    <span
      className={cn(
        'text-sm',
        selected ? 'text-[color:var(--text-primary)]' : 'text-[color:var(--text-muted)]',
      )}
    >
      {selected ? (
        <span className="flex items-center gap-1.5">
          {selected.icon}
          {selected.label}
        </span>
      ) : (
        placeholder
      )}
    </span>
  );

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            'inline-flex items-center gap-1 rounded border border-[color:var(--border)] px-2 py-0.5 text-sm',
            'hover:border-[color:var(--border-strong)] hover:bg-[color:var(--bg-hover)]',
            'focus:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--brand)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          onClick={() => {
            if (!disabled) setOpen((prev) => !prev);
          }}
        >
          {triggerContent}
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          {searchable && <CommandInput placeholder="검색..." />}
          <CommandList>
            <CommandEmpty>결과 없음</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.label}
                  onSelect={() => handleSelect(opt.id)}
                  className="flex items-center gap-2"
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                  {value === opt.id && <Check className="ml-auto h-3.5 w-3.5 opacity-70" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
