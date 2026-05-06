import * as React from 'react';
import { cn } from '@shared/lib/cn';

export interface EditableFieldProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}

export function EditableField({
  value,
  onChange,
  disabled = false,
  multiline = false,
  placeholder,
  className,
}: EditableFieldProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  // value prop이 외부에서 바뀌면 동기화
  React.useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function startEdit() {
    if (disabled) return;
    setDraft(value);
    setEditing(true);
  }

  function commit() {
    setEditing(false);
    onChange(draft);
  }

  function cancel() {
    setEditing(false);
    setDraft(value);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      commit();
    }
    // multiline: Enter는 기본 동작(줄바꿈)만, 저장 안 함
  }

  if (disabled) {
    return (
      <span className={cn('text-sm text-[color:var(--text-primary)]', className)}>
        {value || <span className="text-[color:var(--text-muted)]">{placeholder}</span>}
      </span>
    );
  }

  if (editing) {
    const sharedProps = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: handleKeyDown,
      autoFocus: true,
      className: cn(
        'w-full rounded border border-[color:var(--brand)] bg-[color:var(--bg-app)] px-2 py-0.5 text-sm text-[color:var(--text-primary)] outline-none',
        className,
      ),
    };

    return multiline ? (
      <textarea rows={3} {...sharedProps} />
    ) : (
      <input type="text" {...sharedProps} />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={startEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') startEdit();
      }}
      className={cn(
        'cursor-text rounded px-2 py-0.5 text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--bg-hover)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--brand)]',
        className,
      )}
    >
      {value || <span className="text-[color:var(--text-muted)]">{placeholder}</span>}
    </span>
  );
}
