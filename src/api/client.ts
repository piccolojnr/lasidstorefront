import { API_BASE } from '../lib/constants';
import { getCsrfToken, getCsrfHeaderName } from '../lib/csrf';
import { cartToken } from '../stores/cart-store';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: Record<string, string[]> | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface PaginatedEnvelope<T> extends ApiEnvelope<T[]> {
  meta: PaginationMeta;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: Record<string, string[]> | null = null,
    public readonly data: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const isMutating = method !== 'GET';
  const token = cartToken.get();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { 'X-Cart-Token': token } : {}),
    ...(isMutating
      ? { [getCsrfHeaderName()]: getCsrfToken() ?? '' }
      : {}),
    ...extraHeaders,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // CSRF mismatch — handled by caller if needed
  const envelope = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !envelope.success) {
    throw new ApiError(
      res.status,
      envelope.message ?? 'An unexpected error occurred.',
      envelope.errors,
      envelope.data,
    );
  }

  return envelope.data as T;
}

export const apiClient = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    request<T>('GET', path, undefined, headers),

  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('POST', path, body, headers),

  put: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('PUT', path, body, headers),

  patch: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('PATCH', path, body, headers),

  delete: <T>(path: string, headers?: Record<string, string>) =>
    request<T>('DELETE', path, undefined, headers),

  /** For paginated endpoints that return both `data[]` and `meta`. */
  async paginated<T>(path: string, headers?: Record<string, string>): Promise<PaginatedResult<T>> {
    const token = cartToken.get();

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { 'X-Cart-Token': token } : {}),
      ...headers,
    };

    const res = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      credentials: 'include',
      headers: reqHeaders,
    });

    const envelope = (await res.json()) as PaginatedEnvelope<T>;

    if (!res.ok || !envelope.success) {
      throw new ApiError(
        res.status,
        envelope.message ?? 'An unexpected error occurred.',
        envelope.errors,
        envelope.data,
      );
    }

    return { data: envelope.data ?? [], meta: envelope.meta };
  },
};
