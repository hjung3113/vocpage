/**
 * CustomDateRangePicker.tsx — ADR 0006 §5.
 * react-day-picker `mode="range"` 로 시작/종료일 동시 선택. 부모는 ISO 문자열
 * (`YYYY-MM-DD`) 두 개를 controlled 로 받는다. 5년 초과 날짜는 picker 에서
 * disabled (soft cap; ADR §5 — DB CHECK / zod 미적용).
 */
import * as React from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@shared/lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';

const MS_PER_DAY = 86_400_000;
const FIVE_YEARS_DAYS = 5 * 365;

function parseIsoDate(s: string | null): Date | undefined {
  if (!s) return undefined;
  return new Date(s + 'T00:00:00');
}

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatRange(from?: Date, to?: Date): string {
  const f = from ? toIsoDate(from) : '시작일';
  const t = to ? toIsoDate(to) : '종료일';
  return `${f} ~ ${t}`;
}

export interface CustomDateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (next: { start: string | null; end: string | null }) => void;
  disabled?: boolean;
}

export function CustomDateRangePicker({
  startDate,
  endDate,
  onChange,
  disabled = false,
}: CustomDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const range: DateRange = {
    from: parseIsoDate(startDate),
    to: parseIsoDate(endDate),
  };

  const handleSelect = (next: DateRange | undefined) => {
    if (!next) {
      onChange({ start: null, end: null });
      return;
    }
    onChange({
      start: next.from ? toIsoDate(next.from) : null,
      end: next.to ? toIsoDate(next.to) : null,
    });
  };

  // 5y soft cap: range from anchor (start if set, else today).
  const anchor = range.from ?? new Date();
  const minDate = new Date(anchor.getTime() - FIVE_YEARS_DAYS * MS_PER_DAY);
  const maxDate = new Date(anchor.getTime() + FIVE_YEARS_DAYS * MS_PER_DAY);

  return (
    <div className="mt-2">
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="사용자 지정 날짜 범위 선택"
            className={cn(
              'inline-flex items-center gap-2 rounded border border-[color:var(--border-standard)] px-3 py-1.5 text-sm',
              'hover:border-[color:var(--border-strong)] hover:bg-[color:var(--bg-hover)]',
              'focus:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--brand)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !startDate || !endDate
                ? 'text-[color:var(--text-muted)]'
                : 'text-[color:var(--text-primary)]',
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {formatRange(range.from, range.to)}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={[{ before: minDate }, { after: maxDate }]}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
