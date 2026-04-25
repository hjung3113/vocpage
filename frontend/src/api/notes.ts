export interface InternalNote {
  id: number;
  voc_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export async function listNotes(vocId: string): Promise<InternalNote[]> {
  const res = await fetch(`/api/vocs/${vocId}/notes`);
  if (!res.ok) throw new Error(`listNotes: ${res.status}`);
  return res.json();
}

export async function createNote(vocId: string, body: string): Promise<InternalNote> {
  const res = await fetch(`/api/vocs/${vocId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`createNote: ${res.status}`);
  return res.json();
}

export async function updateNote(
  vocId: string,
  noteId: number,
  body: string,
): Promise<InternalNote> {
  const res = await fetch(`/api/vocs/${vocId}/notes/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`updateNote: ${res.status}`);
  return res.json();
}

export async function deleteNote(vocId: string, noteId: number): Promise<void> {
  const res = await fetch(`/api/vocs/${vocId}/notes/${noteId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`deleteNote: ${res.status}`);
}
