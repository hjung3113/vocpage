/**
 * Unit tests for `escapeLikePattern` — PR #121 review Finding 3 (MED).
 *
 * Free-text `q=` input flows into ILIKE; meta-characters (`%`, `_`, `\`)
 * must be escaped so user input cannot smuggle wildcards or break the
 * `ESCAPE '\\'` clause. Regression guard for ILIKE safety.
 */
import { escapeLikePattern } from '../repository/voc';

describe('escapeLikePattern', () => {
  test('escapes percent', () => {
    expect(escapeLikePattern('100%')).toBe('100\\%');
  });

  test('escapes underscore', () => {
    expect(escapeLikePattern('a_b')).toBe('a\\_b');
  });

  test('escapes backslash itself (and does so before % / _)', () => {
    expect(escapeLikePattern('\\')).toBe('\\\\');
    // backslash 처리가 먼저 일어나야 % escape 가 두 번 escape 되지 않는다.
    expect(escapeLikePattern('\\%')).toBe('\\\\\\%');
  });

  test('escapes mixed meta-characters', () => {
    expect(escapeLikePattern('50%_off')).toBe('50\\%\\_off');
  });

  test('passes plain text through unchanged', () => {
    expect(escapeLikePattern('login error')).toBe('login error');
    expect(escapeLikePattern('VOC-2026-001')).toBe('VOC-2026-001');
  });

  test('handles empty string', () => {
    expect(escapeLikePattern('')).toBe('');
  });
});
