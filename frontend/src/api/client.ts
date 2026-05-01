import type { ZodSchema } from 'zod';

export interface ApiClientOptions {
  credentials?: 'include' | 'omit';
  signal?: AbortSignal;
  headers?: HeadersInit;
}

export interface ErrorEnvelope {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly code: string;
  readonly details?: unknown;
  readonly status: number;

  constructor(envelope: ErrorEnvelope, status: number) {
    super(envelope.message);
    this.name = 'ApiError';
    this.code = envelope.code;
    this.details = envelope.details;
    this.status = status;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  // Canonical shape: { error: { code, message, details? } }.
  // Legacy fallback: { code, message } at top level.
  let envelope: ErrorEnvelope;
  if (
    body &&
    typeof body === 'object' &&
    'error' in body &&
    body.error &&
    typeof body.error === 'object' &&
    'code' in body.error &&
    'message' in body.error
  ) {
    envelope = body.error as ErrorEnvelope;
  } else if (body && typeof body === 'object' && 'code' in body && 'message' in body) {
    envelope = body as ErrorEnvelope;
  } else {
    envelope = { code: `HTTP_${res.status}`, message: res.statusText || 'Request failed' };
  }
  return new ApiError(envelope, res.status);
}

async function request<T>(
  url: string,
  init: RequestInit,
  schema: ZodSchema<T>,
  opts?: ApiClientOptions,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: opts?.credentials ?? 'include',
    signal: opts?.signal,
    headers: { Accept: 'application/json', ...(init.headers ?? {}), ...(opts?.headers ?? {}) },
  });
  if (!res.ok) {
    throw await parseError(res);
  }
  const data = (await res.json()) as unknown;
  return schema.parse(data);
}

export function apiGet<T>(url: string, schema: ZodSchema<T>, opts?: ApiClientOptions): Promise<T> {
  return request(url, { method: 'GET' }, schema, opts);
}

export function apiPost<T>(
  url: string,
  body: unknown,
  schema: ZodSchema<T>,
  opts?: ApiClientOptions,
): Promise<T> {
  return request(
    url,
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    },
    schema,
    opts,
  );
}

export function apiPatch<T>(
  url: string,
  body: unknown,
  schema: ZodSchema<T>,
  opts?: ApiClientOptions,
): Promise<T> {
  return request(
    url,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    },
    schema,
    opts,
  );
}
