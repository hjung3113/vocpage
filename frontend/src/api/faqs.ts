export interface FaqCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_archived: boolean;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category_id: string;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
}

export async function listFaqCategories(): Promise<FaqCategory[]> {
  const res = await fetch('/api/faq-categories');
  if (!res.ok) throw new Error(`listFaqCategories: ${res.status}`);
  return res.json();
}

export async function listFaqs(params?: { category_id?: string; q?: string }): Promise<Faq[]> {
  const qs = new URLSearchParams();
  if (params?.category_id) qs.set('category_id', params.category_id);
  if (params?.q) qs.set('q', params.q);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`/api/faqs${query}`);
  if (!res.ok) throw new Error(`listFaqs: ${res.status}`);
  return res.json();
}

export async function createFaq(payload: Partial<Faq>): Promise<Faq> {
  const res = await fetch('/api/faqs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createFaq: ${res.status}`);
  return res.json();
}

export async function updateFaq(id: string, payload: Partial<Faq>): Promise<Faq> {
  const res = await fetch(`/api/faqs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateFaq: ${res.status}`);
  return res.json();
}

export async function deleteFaq(id: string): Promise<void> {
  const res = await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`deleteFaq: ${res.status}`);
}
