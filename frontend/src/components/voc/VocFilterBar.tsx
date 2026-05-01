import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { VocStatus, type VocFilter } from '../../../../shared/contracts/voc';

const STATUSES = VocStatus.options;

interface Props {
  value: VocFilter;
  onChange: (next: VocFilter) => void;
}

export function VocFilterBar({ value, onChange }: Props) {
  const toggleStatus = (s: (typeof STATUSES)[number]) => {
    const set = new Set(value.status ?? []);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    onChange({ ...value, status: set.size ? Array.from(set) : undefined });
  };
  return (
    <div className="flex flex-wrap items-center gap-2 py-3">
      <div className="flex flex-wrap gap-1" role="group" aria-label="status filter">
        {STATUSES.map((s) => {
          const active = value.status?.includes(s) ?? false;
          return (
            <Button
              key={s}
              variant={active ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleStatus(s)}
              data-testid={`status-chip-${s}`}
              aria-pressed={active}
            >
              {s}
            </Button>
          );
        })}
      </div>
      <div className="ml-auto w-64">
        <Input
          placeholder="검색"
          value={value.q ?? ''}
          onChange={(e) => onChange({ ...value, q: e.target.value || undefined })}
          aria-label="search"
        />
      </div>
    </div>
  );
}
