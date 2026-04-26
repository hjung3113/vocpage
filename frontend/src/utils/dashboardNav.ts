import type { DashboardQueryParams } from '../api/dashboard';

export function buildNav(
  base: DashboardQueryParams,
  extra: Record<string, string | undefined>,
): string {
  const merged: Record<string, string | undefined> = { ...base, ...extra };
  const entries = Object.entries(merged).filter(
    (e): e is [string, string] => e[1] !== undefined && e[1] !== '',
  );
  return '/?' + new URLSearchParams(entries).toString();
}
