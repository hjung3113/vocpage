import { mockLogin, logout, getMe } from '../auth';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('mockLogin', () => {
  test('POSTs to /api/auth/mock-login and returns user', async () => {
    const user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@company.com',
      name: 'Mock Admin',
      role: 'admin',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user }),
    });

    const result = await mockLogin('admin');

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/mock-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' }),
      credentials: 'include',
    });
    expect(result).toEqual(user);
  });

  test('throws when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });

    await expect(mockLogin('admin')).rejects.toThrow('mock-login failed: 400');
  });
});

describe('logout', () => {
  test('POSTs to /api/auth/logout', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

    await logout();

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  });
});

describe('getMe', () => {
  test('GETs /api/auth/me and returns user', async () => {
    const user = {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'user@company.com',
      name: 'Mock User',
      role: 'user',
    };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => user });

    const result = await getMe();

    expect(result).toEqual(user);
  });

  test('returns null when 401', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    const result = await getMe();

    expect(result).toBeNull();
  });
});
