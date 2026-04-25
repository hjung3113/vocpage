import { useEffect, useRef, useState } from 'react';
import {
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  type Attachment,
} from '../../api/attachments';

interface AttachmentListProps {
  vocId: string;
  currentUserId: string;
  currentUserRole: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function AttachmentList({ vocId, currentUserId, currentUserRole }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    listAttachments(vocId)
      .then(setAttachments)
      .catch(() => setError('첨부파일을 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, [vocId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const created = await uploadAttachment(vocId, file);
      setAttachments((prev) => [...prev, created]);
    } catch {
      setError('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(attachmentId: string) {
    try {
      await deleteAttachment(vocId, attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch {
      setError('파일 삭제에 실패했습니다.');
    }
  }

  const canDelete = (uploaderId: string) =>
    uploaderId === currentUserId || currentUserRole === 'admin';

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          불러오는 중...
        </p>
      ) : attachments.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          첨부파일이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <a
                  href={`/api/vocs/${vocId}/attachments/${attachment.id}/download`}
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--brand)' }}
                  download={attachment.filename}
                >
                  {attachment.filename}
                </a>
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <span>{formatBytes(attachment.size_bytes)}</span>
                  <span>·</span>
                  <span>{formatDate(attachment.created_at)}</span>
                </div>
              </div>
              {canDelete(attachment.uploader_id) && (
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="shrink-0 text-xs"
                  style={{ color: 'var(--danger)' }}
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
          id={`file-upload-${vocId}`}
        />
        <label
          htmlFor={`file-upload-${vocId}`}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded text-sm font-medium cursor-pointer"
          style={{
            border: '1px solid var(--border)',
            color: uploading ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? '업로드 중...' : '파일 첨부'}
        </label>
      </div>
    </div>
  );
}
