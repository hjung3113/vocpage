/**
 * ETag-aware GET wrapper.
 *
 * Used by the notifications unread-count poll (Wave 5 W5-D7) — the BE returns
 * 304 Not Modified when the count hasn't changed since the previous fetch's
 * ETag, so we keep the last parsed payload and re-return it.
 *
 * 401 → redirect to /mock-login (per `feature-voc.md §8.6` — polling endpoints
 * must not silently swallow auth expiry).
 */
import type { ZodSchema } from 'zod';
import { ApiError, type ApiClientOptions } from './client';

export interface ETagCache<T> {
  etag: string | null;
  value: T | null;
}

function newCache<T>(): ETagCache<T> {
  return { etag: null, value: null };
}

const caches = new Map<string, ETagCache<unknown>>();

function getCache<T>(key: string): ETagCache<T> {
  let c = caches.get(key) as ETagCache<T> | undefined;
  if (!c) {
    c = newCache<T>();
    caches.set(key, c);
  }
  return c;
}

/** Test-only — clear in-memory ETag cache. */
export function __resetETagCache() {
  caches.clear();
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    const next = window.location.pathname + window.location.search;
    if (window.location.pathname !== '/mock-login') {
      window.location.href = `/mock-login?next=${encodeURIComponent(next)}`;
    }
  }
}

export async function apiGetWithETag<T>(
  url: string,
  schema: ZodSchema<T>,
  opts?: ApiClientOptions,
): Promise<T> {
  const cache = getCache<T>(url);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts?.headers as Record<string, string> | undefined),
  };
  if (cache.etag) headers['If-None-Match'] = cache.etag;

  const res = await fetch(url, {
    method: 'GET',
    credentials: opts?.credentials ?? 'include',
    signal: opts?.signal,
    headers,
  });

  if (res.status === 401) {
    redirectToLogin();
    throw new ApiError({ code: 'UNAUTHENTICATED', message: '인증이 만료되었습니다.' }, 401);
  }
  if (res.status === 304 && cache.value !== null) {
    return cache.value;
  }
  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* noop */
    }
    const envelope =
      body && typeof body === 'object' && 'code' in body && 'message' in body
        ? (body as { code: string; message: string; details?: unknown })
        : { code: `HTTP_${res.status}`, message: res.statusText || 'Request failed' };
    throw new ApiError(envelope, res.status);
  }

  const etag = res.headers.get('ETag');
  if (etag) cache.etag = etag;

  const data = (await res.json()) as unknown;
  const parsed = schema.parse(data);
  cache.value = parsed;
  return parsed;
}
