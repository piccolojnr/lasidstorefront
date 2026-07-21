import { API_BASE, SERVER_API_BASE } from '../lib/constants';
import { getAuthTokenFromBrowserCookie } from '../lib/auth-cookie';
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

function getRequestBase() {
  if (!import.meta.env.SSR) {
    return API_BASE;
  }

  if (SERVER_API_BASE) {
    return SERVER_API_BASE;
  }

  throw new Error(
    'Server-side API requests require `API_BASE` to be set to an absolute URL when `PUBLIC_API_BASE` is relative.',
  );
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const cartTokenValue = cartToken.get();
  const authTokenValue = import.meta.env.SSR ? null : getAuthTokenFromBrowserCookie();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(cartTokenValue ? { 'X-Cart-Token': cartTokenValue } : {}),
    ...(authTokenValue ? { Authorization: `Bearer ${authTokenValue}` } : {}),
    ...extraHeaders,
  };

  const requestBase = getRequestBase();

  const res = await fetch(`${requestBase}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

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

  async paginated<T>(path: string, headers?: Record<string, string>): Promise<PaginatedResult<T>> {
    const cartTokenValue = cartToken.get();
    const authTokenValue = import.meta.env.SSR ? null : getAuthTokenFromBrowserCookie();

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(cartTokenValue ? { 'X-Cart-Token': cartTokenValue } : {}),
      ...(authTokenValue ? { Authorization: `Bearer ${authTokenValue}` } : {}),
      ...headers,
    };

    const requestBase = getRequestBase();

    const res = await fetch(`${requestBase}${path}`, {
      method: 'GET',
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

/**
 * Server-side API client for use inside Astro page frontmatter.
 * Takes the auth token string (extracted from cookies by the caller).
 */
export function createServerClient(authToken: string | null) {
  async function serverRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!SERVER_API_BASE) {
      throw new Error(
        'createServerClient requires `API_BASE` to be set to an absolute URL when `PUBLIC_API_BASE` is relative.',
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    const res = await fetch(`${SERVER_API_BASE}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

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

  async function serverPaginated<T>(path: string): Promise<PaginatedResult<T>> {
    if (!SERVER_API_BASE) {
      throw new Error(
        'createServerClient requires `API_BASE` to be set to an absolute URL when `PUBLIC_API_BASE` is relative.',
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    const res = await fetch(`${SERVER_API_BASE}${path}`, {
      method: 'GET',
      headers,
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
  }

  return {
    get: <T>(path: string) => serverRequest<T>('GET', path),
    post: <T>(path: string, body?: unknown) => serverRequest<T>('POST', path, body),
    paginated: <T>(path: string) => serverPaginated<T>(path),
  };
}
