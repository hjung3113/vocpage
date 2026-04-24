import { Pool } from 'pg';

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return _pool;
}

export function setPool(pool: Pool): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('setPool() is forbidden in production');
  }
  _pool = pool;
}

export function resetPool(): void {
  _pool = null;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const value = getPool()[prop as keyof Pool];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(getPool())
      : value;
  },
});
