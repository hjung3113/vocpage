export interface Comment {
  id: string;
  voc_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export async function listComments(vocId: string): Promise<Comment[]> {
  const res = await fetch(`/api/vocs/${vocId}/comments`);
  if (!res.ok) throw new Error(`listComments: ${res.status}`);
  return res.json();
}

export async function createComment(vocId: string, body: string): Promise<Comment> {
  const res = await fetch(`/api/vocs/${vocId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`createComment: ${res.status}`);
  return res.json();
}

export async function updateComment(
  vocId: string,
  commentId: string,
  body: string,
): Promise<Comment> {
  const res = await fetch(`/api/vocs/${vocId}/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) throw new Error(`updateComment: ${res.status}`);
  return res.json();
}

export async function deleteComment(vocId: string, commentId: string): Promise<void> {
  const res = await fetch(`/api/vocs/${vocId}/comments/${commentId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`deleteComment: ${res.status}`);
}
