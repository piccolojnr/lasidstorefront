const AUTH_TOKEN_COOKIE = 'auth_token';
const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function getAuthTokenFromCookies(cookieHeader: string): string | null {
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AUTH_TOKEN_COOKIE}=`));

  if (!match) return null;

  const value = match.split('=').slice(1).join('=');
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

/**
 * Get auth token from document.cookie (client-side only).
 */
export function getAuthTokenFromBrowserCookie(): string | null {
  if (typeof document === 'undefined') return null;
  return getAuthTokenFromCookies(document.cookie);
}

export function setAuthTokenCookie(token: string): void {
  if (typeof document === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${AUTH_TOKEN_MAX_AGE}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

export function clearAuthTokenCookie(): void {
  if (typeof document === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}
