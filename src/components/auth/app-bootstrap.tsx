import { useEffect } from 'react';
import { authApi } from '../../api/auth';
import { cartApi } from '../../api/cart';
import { sessionStore } from '../../stores/session-store';

/**
 * Invisible island that runs on every page load.
 * - Bootstraps CSRF token
 * - Hydrates session state
 * - Fetches cart so the nav badge is accurate
 */
export default function AppBootstrap() {
  useEffect(() => {
    async function init() {
      try {
        await authApi.bootstrapCsrf();
      } catch {
        // Non-fatal — CSRF will fail gracefully on mutations
      }

      try {
        await authApi.getSession();
      } catch {
        sessionStore.set({ authenticated: false, user: null, email_verified: false, loading: false });
      }

      try {
        await cartApi.getCart();
      } catch {
        // Cart fetch failing is non-fatal
      }
    }

    init();
  }, []);

  return null;
}
