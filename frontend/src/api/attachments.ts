export interface Attachment {
  id: string;
  voc_id: string;
  uploader_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
}

export async function listAttachments(vocId: string): Promise<Attachment[]> {
  const res = await fetch(`/api/vocs/${vocId}/attachments`);
  if (!res.ok) throw new Error(`listAttachments: ${res.status}`);
  return res.json();
}

export async function uploadAttachment(vocId: string, file: File): Promise<Attachment> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/vocs/${vocId}/attachments`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`uploadAttachment: ${res.status}`);
  return res.json();
}

export async function deleteAttachment(vocId: string, attachmentId: string): Promise<void> {
  const res = await fetch(`/api/vocs/${vocId}/attachments/${attachmentId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`deleteAttachment: ${res.status}`);
}
