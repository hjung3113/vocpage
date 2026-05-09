/**
 * FU-025 — Notice visible_from/to KST midnight serialization.
 *
 * Spec: feature-notice-faq.md §10.3.3-bis. Date-only inputs from the admin
 * dialog must serialize to `YYYY-MM-DDT00:00:00+09:00` instants so the
 * persisted timestamp matches admin intent regardless of browser timezone.
 */
import { describe, it, expect } from 'vitest';
import { toKstMidnightInstant, toCreatePayload } from '../NoticeFormDialog';

describe('FU-025 — Notice KST midnight serialization', () => {
  describe('toKstMidnightInstant', () => {
    it('formats YYYY-MM-DD as KST midnight instant', () => {
      expect(toKstMidnightInstant('2026-05-10')).toBe('2026-05-10T00:00:00+09:00');
    });

    it('preserves arbitrary forward dates', () => {
      expect(toKstMidnightInstant('2030-12-31')).toBe('2030-12-31T00:00:00+09:00');
    });
  });

  describe('toCreatePayload', () => {
    const base = {
      title: 't',
      body: 'b',
      level: 'normal' as const,
      is_popup: false,
      is_visible: true,
    };

    it('serializes visible_from / visible_to to KST midnight when set', () => {
      const payload = toCreatePayload({
        ...base,
        visible_from: '2026-05-10',
        visible_to: '2026-05-20',
      });
      expect(payload.visible_from).toBe('2026-05-10T00:00:00+09:00');
      expect(payload.visible_to).toBe('2026-05-20T00:00:00+09:00');
    });

    it('emits null when fields are empty', () => {
      const payload = toCreatePayload({
        ...base,
        visible_from: '',
        visible_to: '',
      });
      expect(payload.visible_from).toBeNull();
      expect(payload.visible_to).toBeNull();
    });

    it('does not depend on browser timezone (regression: previous toISOString() bug)', () => {
      // Prior code: `new Date('2026-05-10').toISOString()` →
      // `2026-05-10T00:00:00.000Z` (UTC midnight = KST 09:00 — 9h off).
      // Spec policy is KST midnight, not UTC midnight.
      const payload = toCreatePayload({ ...base, visible_from: '2026-05-10', visible_to: '' });
      expect(payload.visible_from).not.toMatch(/Z$/);
      expect(payload.visible_from).toMatch(/\+09:00$/);
    });
  });
});
