import { useState } from 'react';
import { TabsContent } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { LoadingState } from '../../../components/common/LoadingState';
import type { InternalNote, VocHistoryEntry } from '../../../../../shared/contracts/voc';

export interface AttachmentItem {
  id: string;
  name: string;
  size: number;
  href: string;
}

interface CommentsPanelProps {
  notes: InternalNote[] | undefined;
  notesLoading: boolean;
  canWrite: boolean;
  pending: boolean;
  onAdd: (body: string) => void;
}

export function VocCommentsPanel({
  notes,
  notesLoading,
  canWrite,
  pending,
  onAdd,
}: CommentsPanelProps) {
  const [body, setBody] = useState('');
  return (
    <TabsContent value="comments" data-testid="drawer-notes">
      {notesLoading && <LoadingState />}
      {!notesLoading && notes && notes.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          아직 작성된 코멘트가 없습니다.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {notes?.map((n) => (
          <li
            key={n.id}
            className="rounded border p-2 text-sm"
            style={{ borderColor: 'var(--border-standard)' }}
          >
            <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {n.created_at.slice(0, 16).replace('T', ' ')}
            </div>
            {n.body}
          </li>
        ))}
      </ul>
      {canWrite && (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) {
              onAdd(body.trim());
              setBody('');
            }
          }}
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="코멘트를 입력하세요"
            aria-label="new note"
          />
          <Button type="submit" disabled={pending || !body.trim()} size="sm">
            저장
          </Button>
        </form>
      )}
    </TabsContent>
  );
}

interface AttachmentsPanelProps {
  items: AttachmentItem[];
  canUpload: boolean;
}

export function VocAttachmentsPanel({ items, canUpload }: AttachmentsPanelProps) {
  return (
    <TabsContent value="attachments" data-testid="drawer-attachments">
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
        <Button type="button" size="sm" className="mt-3" disabled aria-label="첨부 업로드">
          파일 업로드
        </Button>
      )}
    </TabsContent>
  );
}

interface HistoryPanelProps {
  entries: VocHistoryEntry[] | undefined;
  loading: boolean;
}

const FIELD_LABEL: Record<string, string> = {
  status: '상태',
  priority: '우선순위',
  assignee_id: '담당자',
  due_date: '마감일',
  title: '제목',
};

export function VocHistoryPanel({ entries, loading }: HistoryPanelProps) {
  return (
    <TabsContent value="history" data-testid="drawer-history">
      {loading && <LoadingState />}
      {!loading && entries && entries.length === 0 && (
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          변경 이력이 없습니다.
        </p>
      )}
      <ol className="flex flex-col gap-2">
        {entries?.map((h) => (
          <li
            key={h.id}
            className="rounded border p-2 text-xs"
            style={{ borderColor: 'var(--border-standard)' }}
          >
            <div style={{ color: 'var(--text-secondary)' }}>
              {h.changed_at.slice(0, 16).replace('T', ' ')}
            </div>
            <div style={{ color: 'var(--text-primary)' }}>
              {FIELD_LABEL[h.field] ?? h.field}: {h.old_value ?? '∅'} → {h.new_value ?? '∅'}
            </div>
          </li>
        ))}
      </ol>
    </TabsContent>
  );
}
