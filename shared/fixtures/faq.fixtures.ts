/**
 * @module shared/fixtures/faq.fixtures
 *
 * Deterministic FAQ fixtures (FE MSW + future BE seed).
 * Spec: docs/specs/requires/feature-notice-faq.md §10.4.
 */
import { Faq, type Faq as FaqT } from '../contracts/faq';
import { FIXTURE_USERS } from '../contracts/voc/users';
import { FAQ_CATEGORY_FIXTURES } from './faq-category.fixtures';

const ISO = '2026-04-01T00:00:00.000Z';
const CAT_ACCOUNT = FAQ_CATEGORY_FIXTURES[0]!;
const CAT_VOC = FAQ_CATEGORY_FIXTURES[1]!;
const CAT_PERMS = FAQ_CATEGORY_FIXTURES[2]!;

export const FAQ_FIXTURES: ReadonlyArray<FaqT> = [
  Faq.parse({
    id: '33333333-eeee-4eee-8eee-000000000001',
    question: '비밀번호를 잊었어요. 어떻게 재설정하나요?',
    answer: '<p>로그인 화면 하단의 "비밀번호 재설정" 링크를 사용하세요.</p>',
    category_id: CAT_ACCOUNT.id,
    is_visible: true,
    sort_order: 1,
    author_id: FIXTURE_USERS.admin,
    deleted_at: null,
    created_at: ISO,
    updated_at: ISO,
  }),
  Faq.parse({
    id: '33333333-eeee-4eee-8eee-000000000002',
    question: 'VOC 등록 시 첨부파일은 몇 개까지 가능한가요?',
    answer: '<p>한 번에 최대 5개까지 첨부할 수 있습니다.</p>',
    category_id: CAT_VOC.id,
    is_visible: true,
    sort_order: 1,
    author_id: FIXTURE_USERS.manager,
    deleted_at: null,
    created_at: ISO,
    updated_at: ISO,
  }),
  Faq.parse({
    id: '33333333-eeee-4eee-8eee-000000000003',
    question: 'Manager와 Admin의 차이는 무엇인가요?',
    answer: '<p>Admin은 카테고리 CRUD 및 삭제 항목 복원이 가능합니다.</p>',
    category_id: CAT_PERMS.id,
    is_visible: true,
    sort_order: 1,
    author_id: FIXTURE_USERS.admin,
    deleted_at: null,
    created_at: ISO,
    updated_at: ISO,
  }),
];
