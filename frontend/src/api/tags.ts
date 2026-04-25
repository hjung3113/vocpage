export interface Tag {
  id: string;
  name: string;
  slug: string;
  kind: string;
  created_at: string;
}

export interface VocTag {
  tag_id: string;
  name: string;
  slug: string;
  source: 'manual' | 'rule';
}

export interface TagRule {
  id: string;
  name: string;
  pattern: string;
  tag_id: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export async function listTags(): Promise<Tag[]> {
  const res = await fetch('/api/tags');
  if (!res.ok) throw new Error(`listTags: ${res.status}`);
  return res.json();
}

export async function listVocTags(vocId: string): Promise<VocTag[]> {
  const res = await fetch(`/api/vocs/${vocId}/tags`);
  if (!res.ok) throw new Error(`listVocTags: ${res.status}`);
  return res.json();
}

export async function addVocTag(vocId: string, tagId: string): Promise<VocTag> {
  const res = await fetch(`/api/vocs/${vocId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_id: tagId }),
  });
  if (!res.ok) throw new Error(`addVocTag: ${res.status}`);
  return res.json();
}

export async function removeVocTag(vocId: string, tagId: string): Promise<void> {
  const res = await fetch(`/api/vocs/${vocId}/tags/${tagId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`removeVocTag: ${res.status}`);
}

export async function listTagRules(): Promise<TagRule[]> {
  const res = await fetch('/api/tag-rules');
  if (!res.ok) throw new Error(`listTagRules: ${res.status}`);
  return res.json();
}

export async function createTagRule(payload: {
  name: string;
  pattern: string;
  tag_id: string;
  sort_order?: number;
}): Promise<TagRule> {
  const res = await fetch('/api/tag-rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createTagRule: ${res.status}`);
  return res.json();
}

export async function updateTagRule(
  id: string,
  payload: Partial<{ name: string; pattern: string; is_active: boolean; sort_order: number }>,
): Promise<TagRule> {
  const res = await fetch(`/api/tag-rules/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateTagRule: ${res.status}`);
  return res.json();
}

export async function deleteTagRule(id: string): Promise<void> {
  const res = await fetch(`/api/tag-rules/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`deleteTagRule: ${res.status}`);
}
