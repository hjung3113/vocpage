import { useEffect, useState } from 'react';
import { listNotes, createNote, updateNote, deleteNote, type InternalNote } from '../../api/notes';

interface InternalNotesSectionProps {
  vocId: string;
  currentUserId: string;
  currentUserRole: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function InternalNotesSection({
  vocId,
  currentUserId,
  currentUserRole,
}: InternalNotesSectionProps) {
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editBody, setEditBody] = useState('');

  useEffect(() => {
    if (currentUserRole === 'user') return;
    setIsLoading(true);
    setError(null);
    listNotes(vocId)
      .then(setNotes)
      .catch(() => setError('내부 메모를 불러오지 못했습니다.'))
      .finally(() => setIsLoading(false));
  }, [vocId, currentUserRole]);

  async function handleCreate() {
    if (!newBody.trim()) return;
    setSubmitting(true);
    try {
      const created = await createNote(vocId, newBody.trim());
      setNotes((prev) => [...prev, created]);
      setNewBody('');
    } catch {
      setError('메모 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(noteId: number) {
    if (!editBody.trim()) return;
    try {
      const updated = await updateNote(vocId, noteId, editBody.trim());
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setEditingId(null);
      setEditBody('');
    } catch {
      setError('메모 수정에 실패했습니다.');
    }
  }

  async function handleDelete(noteId: number) {
    try {
      await deleteNote(vocId, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      setError('메모 삭제에 실패했습니다.');
    }
  }

  function startEdit(note: InternalNote) {
    setEditingId(note.id);
    setEditBody(note.body);
  }

  if (currentUserRole === 'user') return null;

  const canModify = (authorId: string) => authorId === currentUserId || currentUserRole === 'admin';

  return (
    <div
      className="flex flex-col gap-4 mt-6 p-4 rounded-lg"
      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
    >
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        내부 메모 (관리자 전용)
      </p>

      {error && (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          불러오는 중...
        </p>
      ) : notes.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          내부 메모가 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex flex-col gap-1 p-3 rounded-lg"
              style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {note.author_id}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatDate(note.created_at)}
                </span>
              </div>

              {editingId === note.id ? (
                <div className="flex flex-col gap-2 mt-1">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    className="w-full rounded px-3 py-2 text-sm resize-none"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(note.id)}
                      className="px-3 py-1 rounded text-xs font-medium"
                      style={{
                        background: 'var(--brand)',
                        color: 'var(--text-on-brand)',
                        border: 'none',
                      }}
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditBody('');
                      }}
                      className="px-3 py-1 rounded text-xs"
                      style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className="text-sm whitespace-pre-wrap break-words"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {note.body}
                  </p>
                  {canModify(note.author_id) && (
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => startEdit(note)}
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        편집
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="text-xs"
                        style={{ color: 'var(--danger)' }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          placeholder="내부 메모를 입력하세요..."
          rows={3}
          className="w-full rounded px-3 py-2 text-sm resize-none"
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={handleCreate}
          disabled={submitting || !newBody.trim()}
          className="self-end px-4 py-1.5 rounded text-sm font-medium"
          style={{
            background: newBody.trim() ? 'var(--brand)' : 'var(--bg-surface)',
            color: newBody.trim() ? 'var(--text-on-brand)' : 'var(--text-muted)',
            border: '1px solid var(--border)',
            cursor: submitting || !newBody.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? '작성 중...' : '메모 작성'}
        </button>
      </div>
    </div>
  );
}
