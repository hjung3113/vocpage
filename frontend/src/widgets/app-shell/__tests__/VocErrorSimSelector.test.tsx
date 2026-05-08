import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VocErrorSimSelector } from '../VocErrorSimSelector';
import { getErrorSimMode, setErrorSimMode } from '../../../test/mocks/errorSim';

let mockRole: 'admin' | 'manager' | 'dev' | 'user' = 'dev';
vi.mock('@entities/user/model/useRole', () => ({
  useRole: () => ({
    role: mockRole,
    isUser: mockRole === 'user',
    isDev: mockRole === 'dev',
    isManager: mockRole === 'manager',
    isAdmin: mockRole === 'admin',
    setRole: vi.fn(),
  }),
}));

describe('VocErrorSimSelector', () => {
  beforeEach(() => {
    setErrorSimMode('off');
  });

  it('user 역할에서는 렌더되지 않음', () => {
    mockRole = 'user';
    const { container } = render(<VocErrorSimSelector />);
    expect(container.firstChild).toBeNull();
  });

  it('dev 역할에서 옵션 변경 시 errorSim 모드 갱신', async () => {
    mockRole = 'dev';
    const user = userEvent.setup();
    render(<VocErrorSimSelector />);
    const select = screen.getByLabelText('MSW 오류 시뮬레이션') as HTMLSelectElement;
    await user.selectOptions(select, 'http-500');
    expect(getErrorSimMode()).toBe('http-500');
  });
});
