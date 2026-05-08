import { forwardRef } from 'react';

interface VocCreateTitleInputProps {
  value: string;
  error: string;
  onChange: (value: string) => void;
}

export const VocCreateTitleInput = forwardRef<HTMLTextAreaElement, VocCreateTitleInputProps>(
  function VocCreateTitleInput({ value, error, onChange }, ref) {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    };

    return (
      <div>
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          placeholder="제목을 입력하세요..."
          rows={1}
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
        {error && (
          <span className="mt-1 block text-[11px]" style={{ color: 'var(--status-red)' }}>
            {error}
          </span>
        )}
      </div>
    );
  },
);
