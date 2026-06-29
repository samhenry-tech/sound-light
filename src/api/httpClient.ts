/** Thin fetch wrapper for the AWS HTTP API, validating responses with Zod. */
import type { z } from 'zod';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** When false, the app uses the in-browser localStorage data adapter. */
export const IS_API_ENABLED = Boolean(API_BASE_URL);

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiRequest<S extends z.ZodTypeAny> {
  token: string | null;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Response schema; omit for empty (204) responses. */
  schema?: S;
}

export async function apiFetch<S extends z.ZodTypeAny>(
  path: string,
  { token, method = 'GET', body, schema }: ApiRequest<S>,
): Promise<z.infer<S>> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    throw new ApiError(res.status, `Request to ${path} failed (${res.status}).`);
  }
  if (res.status === 204 || !schema) {
    return undefined as z.infer<S>;
  }
  return schema.parse(await res.json());
}
