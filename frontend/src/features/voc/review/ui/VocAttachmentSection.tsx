import { Button } from '@shared/ui/button';
import { CollapsibleSection } from './CollapsibleSection';

export interface AttachmentItem {
  id: string;
  name: string;
  size: number;
  href: string;
}

interface AttachmentSectionProps {
  items: AttachmentItem[];
  canUpload: boolean;
  noBorder?: boolean;
}

export function VocAttachmentSection({ items, canUpload, noBorder }: AttachmentSectionProps) {
  return (
    <CollapsibleSection title="첨부" testId="drawer-attachments" noBorder={noBorder}>
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          첨부 파일이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded border p-2 text-sm"
              style={{ borderColor: 'var(--border-standard)' }}
            >
              <a
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate"
                style={{ color: 'var(--brand)' }}
              >
                {a.name}
              </a>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {(a.size / 1024).toFixed(1)} KB
              </span>
            </li>
          ))}
        </ul>
      )}
      {canUpload && (
        <Button
          type="button"
          size="sm"
          className="mt-1 self-start"
          disabled
          aria-label="첨부 업로드"
        >
          파일 업로드
        </Button>
      )}
    </CollapsibleSection>
  );
}
