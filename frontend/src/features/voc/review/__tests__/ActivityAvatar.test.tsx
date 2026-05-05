import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ActivityAvatar } from '../ui/ActivityAvatar';
import { formatActivityTime } from '../lib/formatActivityTime';

describe('formatActivityTime', () => {
  it('ISO 문자열을 "YYYY-MM-DD HH:mm" 형식으로 변환한다', () => {
    expect(formatActivityTime('2026-05-06T10:30:00')).toBe('2026-05-06 10:30');
  });

  it('Z suffix가 있어도 로컬 타임존 변환 없이 슬라이스 — 추후 서버측 localtime 반환 시 정상', () => {
    // TODO: 서버가 UTC ISO를 반환할 경우 localtime 변환 필요
    expect(formatActivityTime('2026-01-01T00:00:00Z')).toBe('2026-01-01 00:00');
  });
});

describe('ActivityAvatar', () => {
  it('userId의 첫 글자 대문자를 노출한다', () => {
    const { container } = render(<ActivityAvatar userId="abc123" />);
    expect(container.textContent).toBe('A');
  });

  it('userId가 빈 문자열이면 "?"를 노출한다', () => {
    const { container } = render(<ActivityAvatar userId="" />);
    expect(container.textContent).toBe('?');
  });
});
