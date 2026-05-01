import { assertCanManageVoc } from '../assertCanManageVoc';
import { HttpError } from '../../../middleware/httpError';
import type { AuthUser } from '../../../auth/types';

const devUser: Pick<AuthUser, 'id' | 'role'> = {
  id: '00000000-0000-0000-0000-000000000004',
  role: 'dev',
};

const otherUserId = '00000000-0000-0000-0000-000000000099';

const baseVoc = {
  id: 'voc-1',
  assignee_id: devUser.id,
  deleted_at: null,
};

describe('assertCanManageVoc — feature-voc.md §8.4-bis 회귀 5건', () => {
  test('1) Dev 본인 담당 VOC 상태 변경 → 허용', () => {
    expect(() => assertCanManageVoc(devUser, baseVoc, 'changeStatus')).not.toThrow();
  });

  test('2) Dev 타인 담당 VOC 상태 변경 → FORBIDDEN', () => {
    const voc = { ...baseVoc, assignee_id: otherUserId };
    expect(() => assertCanManageVoc(devUser, voc, 'changeStatus')).toThrow(HttpError);
    try {
      assertCanManageVoc(devUser, voc, 'changeStatus');
    } catch (e) {
      expect((e as HttpError).status).toBe(403);
      expect((e as HttpError).code).toBe('FORBIDDEN');
    }
  });

  test('3) Dev unassigned VOC Priority 변경 → FORBIDDEN', () => {
    const voc = { ...baseVoc, assignee_id: null };
    expect(() => assertCanManageVoc(devUser, voc, 'setPriority')).toThrow(HttpError);
  });

  test('4) Dev 본인 담당 VOC internal note 작성 → 허용', () => {
    expect(() => assertCanManageVoc(devUser, baseVoc, 'writeInternalNote')).not.toThrow();
  });

  test('5) Dev 재배정 직후 internal note 작성 시도 → FORBIDDEN', () => {
    const reassigned = { ...baseVoc, assignee_id: otherUserId };
    expect(() => assertCanManageVoc(devUser, reassigned, 'writeInternalNote')).toThrow(HttpError);
  });

  test('Admin / Manager 항상 허용', () => {
    const admin = { id: 'a', role: 'admin' as const };
    const manager = { id: 'm', role: 'manager' as const };
    expect(() => assertCanManageVoc(admin, baseVoc, 'changeStatus')).not.toThrow();
    expect(() => assertCanManageVoc(manager, baseVoc, 'editTags')).not.toThrow();
  });

  test('User → 모든 action FORBIDDEN', () => {
    const user = { id: 'u', role: 'user' as const };
    expect(() => assertCanManageVoc(user, baseVoc, 'changeStatus')).toThrow(HttpError);
  });
});
