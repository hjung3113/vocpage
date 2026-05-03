import { useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

export const ATTACHMENT_MAX_FILES = 5;
export const ATTACHMENT_MAX_SIZE_MB = 10;
export const ATTACHMENT_ACCEPT = 'image/png,image/jpeg,image/gif,image/webp';

const ACCEPTED_TYPES = new Set(ATTACHMENT_ACCEPT.split(','));
const MAX_BYTES = ATTACHMENT_MAX_SIZE_MB * 1024 * 1024;

export interface AttachmentZoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

type ValidationError =
  | { kind: 'count' }
  | { kind: 'type'; name: string }
  | { kind: 'size'; name: string };

function validateAddition(current: File[], incoming: File[]): ValidationError | null {
  if (current.length + incoming.length > ATTACHMENT_MAX_FILES) return { kind: 'count' };
  for (const f of incoming) {
    if (!ACCEPTED_TYPES.has(f.type)) return { kind: 'type', name: f.name };
    if (f.size > MAX_BYTES) return { kind: 'size', name: f.name };
  }
  return null;
}

function errorMessage(err: ValidationError): string {
  switch (err.kind) {
    case 'count':
      return `첨부는 최대 ${ATTACHMENT_MAX_FILES}개까지 가능합니다`;
    case 'type':
      return `${err.name}: 이미지 파일만 첨부할 수 있습니다`;
    case 'size':
      return `${err.name}: 파일당 최대 ${ATTACHMENT_MAX_SIZE_MB}MB까지 가능합니다`;
  }
}

export function AttachmentZone({ files, onChange, disabled = false }: AttachmentZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const inputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const acceptIncoming = (incoming: File[]) => {
    if (incoming.length === 0) return;
    const err = validateAddition(files, incoming);
    if (err) {
      setError(errorMessage(err));
      return;
    }
    setError(null);
    onChange([...files, ...incoming]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    acceptIncoming(incoming);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (idx: number) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  const openPicker = () => inputRef.current?.click();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    acceptIncoming(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span id={labelId} className="text-sm font-medium text-[color:var(--text-primary)]">
          <label htmlFor={inputId} className="cursor-pointer">
            첨부파일
          </label>
          <span className="ml-1 text-[10px] text-[color:var(--text-quaternary)]">
            (선택 · 이미지만 · 최대 {ATTACHMENT_MAX_FILES}개)
          </span>
        </span>
        <span
          data-testid="attachment-zone-count"
          className="rounded-full border border-[color:var(--border-standard)] px-2 py-0.5 text-[11px] text-[color:var(--text-secondary)]"
        >
          {files.length}/{ATTACHMENT_MAX_FILES}
        </span>
      </div>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed px-4 py-6 text-sm transition-colors ${
          dragOver
            ? 'border-[color:var(--brand)] bg-[color:var(--bg-elevated)]'
            : 'border-[color:var(--border-standard)] bg-[color:var(--bg-app)]'
        } ${disabled ? 'opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          id={inputId}
          data-testid="attachment-zone-input"
          type="file"
          multiple
          accept={ATTACHMENT_ACCEPT}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
        />
        <span className="text-[color:var(--text-secondary)]">
          이미지 드래그 또는{' '}
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled}
            className="font-medium text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            선택
          </button>
        </span>
        <span className="text-[11px] text-[color:var(--text-quaternary)]">
          파일당 최대 {ATTACHMENT_MAX_SIZE_MB}MB
        </span>
      </div>
      {error && (
        <div role="alert" className="text-xs text-[color:var(--status-drop)]">
          {error}
        </div>
      )}
      {files.length > 0 && (
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-2 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-surface)] px-2 py-1 text-xs"
            >
              <span className="truncate text-[color:var(--text-primary)]" title={f.name}>
                {f.name}
              </span>
              <button
                type="button"
                aria-label={`${f.name} 제거`}
                onClick={() => handleRemove(i)}
                className="text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AttachmentZone;
