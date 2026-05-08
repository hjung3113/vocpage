import { forwardRef } from 'react';

// requirements.md §6.3 + feature-voc.md §8.4 — VOC 제목은 최대 200자.
export const VOC_TITLE_MAX = 200;

interface VocCreateTitleInputProps {
  value: string;
  error: string;
  onChange: (value: string) => void;
}

export const VocCreateTitleInput = forwardRef<HTMLTextAreaElement, VocCreateTitleInputProps>(
  function VocCreateTitleInput({ value, error, onChange }, ref) {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value.slice(0, VOC_TITLE_MAX);
      onChange(next);
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const remaining = VOC_TITLE_MAX - value.length;
    const isNear = remaining <= 20;

    return (
      <div>
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          placeholder="제목을 입력하세요..."
          rows={1}
          maxLength={VOC_TITLE_MAX}
          aria-label="VOC 제목"
          className="w-full resize-none overflow-hidden"
          style={{
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: '1.4',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-ui)',
          }}
        />
        <div className="mt-1 flex items-center justify-between gap-2">
          {error ? (
            <span className="text-[11px]" style={{ color: 'var(--status-red)' }}>
              {error}
            </span>
          ) : (
            <span />
          )}
          <span
            data-testid="voc-title-counter"
            className="text-[11px] tabular-nums"
            style={{ color: isNear ? 'var(--status-orange)' : 'var(--text-quaternary)' }}
          >
            {value.length}/{VOC_TITLE_MAX}
          </span>
        </div>
      </div>
    );
  },
);
