import { atom } from 'nanostores';
import { getAuthTokenFromBrowserCookie } from '../lib/auth-cookie';

export interface AuthState {
  token: string | null;
}

/**
 * Client-side auth state. The cookie (auth_token) is the source of truth.
 * This store is for reactive UI updates only.
 */
export const authStore = atom<AuthState>({
  token: null,
});

/**
 * Read the auth token from cookie and update the store.
 * Call this on page load to hydrate client-side state.
 */
export function hydrateAuthFromCookie(): void {
  const token = getAuthTokenFromBrowserCookie();
  authStore.set({ token });
}

export function getAuthToken(): string | null {
  return authStore.get().token;
}
