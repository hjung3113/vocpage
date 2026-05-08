/**
 * MSW handlers for /api/faq-categories.
 */
import { http, HttpResponse } from 'msw';
import { FaqCategoryListResponse } from '../../../../../shared/contracts/faq';
import { FAQ_CATEGORY_FIXTURES } from '../../../../../shared/fixtures/faq-category.fixtures';

export const faqCategoryHandlers = [
  http.get('/api/faq-categories', () => {
    const body = FaqCategoryListResponse.parse({ rows: [...FAQ_CATEGORY_FIXTURES] });
    return HttpResponse.json(body);
  }),
];
