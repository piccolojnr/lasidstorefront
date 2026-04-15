/**
 * CSRF token management for browser session requests.
 *
 * Flow:
 * 1. Call bootstrapCsrf() once on app load (root layout island).
 * 2. getCsrfToken() reads the cookie set by the backend.
 * 3. The API client calls getCsrfToken() and injects the header on non-GET requests.
 */

let csrfHeaderName = 'X-XSRF-TOKEN';
let csrfCookieName = 'XSRF-STOREFRONT-TOKEN';

export function setCsrfNames(cookieName: string, headerName: string): void {
  csrfCookieName = cookieName;
  csrfHeaderName = headerName;
}

export function getCsrfHeaderName(): string {
  return csrfHeaderName;
}

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${csrfCookieName}=`));

  if (!match) return null;

  return decodeURIComponent(match.split('=')[1] ?? '');
}
