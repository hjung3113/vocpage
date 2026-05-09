/**
 * MSW handlers for /api/faqs.
 */
import { http, HttpResponse } from 'msw';
import { FaqListResponse } from '../../../../../shared/contracts/faq';
import { FAQ_FIXTURES } from '../../../../../shared/fixtures/faq.fixtures';

export const faqHandlers = [
  http.get('/api/faqs', ({ request }) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode') ?? 'user';
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
    const categoryId = url.searchParams.get('category_id') ?? undefined;
    const q = url.searchParams.get('q')?.toLowerCase();
    let rows = FAQ_FIXTURES.slice();
    if (!includeDeleted) rows = rows.filter((r) => r.deleted_at === null);
    if (mode !== 'admin') rows = rows.filter((r) => r.is_visible);
    if (categoryId) rows = rows.filter((r) => r.category_id === categoryId);
    if (q) {
      rows = rows.filter(
        (r) => r.question.toLowerCase().includes(q) || r.answer.toLowerCase().includes(q),
      );
    }
    const body = FaqListResponse.parse({
      rows,
      page: 1,
      per_page: 20,
      total: rows.length,
    });
    return HttpResponse.json(body);
  }),
];
