import type { VocStatus } from '../../contexts/VOCFilterContext';

const STATUS_OPTIONS: Array<{ label: string; value: VocStatus | null }> = [
  { label: '전체', value: null },
  { label: '접수', value: '접수' },
  { label: '검토중', value: '검토중' },
  { label: '처리중', value: '처리중' },
  { label: '완료', value: '완료' },
  { label: '드랍', value: '드랍' },
];

interface VocFilterBarProps {
  activeStatus: VocStatus | null;
  onStatusChange: (status: VocStatus | null) => void;
}

export function VocFilterBar({ activeStatus, onStatusChange }: VocFilterBarProps) {
  return (
    <div
      className="flex items-center gap-2 px-6 py-2 shrink-0"
      style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)' }}
    >
      {STATUS_OPTIONS.map(({ label, value }) => {
        const isActive = activeStatus === value;
        return (
          <button
            key={label}
            onClick={() => onStatusChange(value)}
            className="px-3 py-1 rounded-full text-sm font-medium transition-colors"
            style={{
              background: isActive ? 'var(--brand)' : 'var(--bg-surface)',
              color: isActive ? 'var(--text-on-brand)' : 'var(--text-secondary)',
              border: `1px solid ${isActive ? 'var(--brand)' : 'var(--border)'}`,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
