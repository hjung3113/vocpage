import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import type { AuthRole } from '../api/auth';

export default function MockLoginPage() {
  const { login } = useContext(AuthContext)!;
  const [role, setRole] = useState<AuthRole>('admin');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(role);
      navigate('/');
    } catch {
      setError('로그인 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: 'var(--bg-app)' }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 p-8 rounded-lg"
        style={{ background: 'var(--bg-panel)' }}
      >
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          개발용 Mock 로그인
        </h1>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AuthRole)}
          className="px-3 py-2 rounded border"
          style={{
            color: 'var(--text-primary)',
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
          }}
        >
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="user">User</option>
        </select>

        {error && (
          <p role="alert" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded font-medium"
          style={{ background: 'var(--brand)', color: 'var(--text-on-brand)' }}
        >
          로그인
        </button>
      </form>
    </div>
  );
}
