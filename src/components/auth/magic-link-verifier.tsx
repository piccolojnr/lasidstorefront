import { useEffect, useState } from 'react';
import { authApi } from '../../api/auth';
import { setAuthTokenCookie } from '../../lib/auth-cookie';

interface Props {
  token: string;
  redirectTo: string;
}

export default function MagicLinkVerifier({ token, redirectTo }: Props) {
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    authApi
      .verifyMagicLink(token)
      .then((result) => {
        if (cancelled) return;

        setAuthTokenCookie(result.token);
        window.location.replace(result.redirect_to || redirectTo);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [redirectTo, token]);

  if (error) {
    return (
      <a className="text-sm text-destructive underline" href="/auth/login?auth_error=invalid_or_expired_link">
        This sign-in link has expired or is invalid. Request a new one.
      </a>
    );
  }

  return <p className="text-sm text-muted-foreground">Signing you in...</p>;
}
