import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';

export interface EditableDatePickerProps {
  value: string | null;
  onChange: (v: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function EditableDatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = '날짜 선택',
}: EditableDatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = value ? new Date(value + 'T00:00:00') : undefined;

  function handleSelect(day: Date | undefined) {
    if (!day) return;
    const iso = day.toISOString().slice(0, 10);
    onChange(iso);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'inline-flex items-center gap-1.5 rounded border border-[color:var(--border-standard)] px-2 py-0.5 text-sm',
              'hover:border-[color:var(--border-strong)] hover:bg-[color:var(--bg-hover)]',
              'focus:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--brand)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !value && 'text-[color:var(--text-muted)]',
              value && 'text-[color:var(--text-primary)]',
            )}
            onClick={() => {
              if (!disabled) setOpen((prev) => !prev);
            }}
          >
            <CalendarIcon className="h-3.5 w-3.5 opacity-60" />
            {value || placeholder}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker mode="single" selected={selected} onSelect={handleSelect} className="p-3" />
        </PopoverContent>
      </Popover>
      {value && !disabled && (
        <button
          type="button"
          aria-label="날짜 지우기"
          onClick={handleClear}
          className="rounded p-0.5 text-[color:var(--text-muted)] hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text-primary)] focus:outline-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
