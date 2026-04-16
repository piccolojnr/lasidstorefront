/**
 * CSRF token management for browser session requests.
 *
 * Flow:
 * 1. Call bootstrapCsrf() once on app load (root layout island).
 * 2. getCsrfToken() returns the token stored from the bootstrap response body,
 *    falling back to reading the cookie (for non-HttpOnly cookies).
 * 3. The API client calls getCsrfToken() and injects the header on non-GET requests.
 */

let csrfHeaderName = 'X-STOREFRONT-CSRF-TOKEN';
let csrfCookieName = 'XSRF-STOREFRONT-TOKEN';
let csrfTokenValue: string | null = null;

export function setCsrfNames(cookieName: string, headerName: string): void {
  csrfCookieName = cookieName;
  csrfHeaderName = headerName;
}

export function setCsrfToken(token: string): void {
  csrfTokenValue = token;
}

export function getCsrfHeaderName(): string {
  return csrfHeaderName;
}

export function getCsrfToken(): string | null {
  // Prefer the token stored directly from the bootstrap response body,
  // since the cookie may be HttpOnly and unreadable from JS.
  if (csrfTokenValue) return csrfTokenValue;

  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${csrfCookieName}=`));

  if (!match) return null;

  return decodeURIComponent(match.split('=')[1] ?? '');
}
