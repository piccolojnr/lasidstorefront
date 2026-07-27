import { useState } from 'react';
import { authApi } from '../../api/auth';
import { setAuthTokenCookie } from '../../lib/auth-cookie';

interface Props {
  token: string;
  redirectTo: string;
}

export default function MagicLinkVerifier({ token, redirectTo }: Props) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'error'>('idle');

  const verify = async () => {
    setStatus('verifying');

    try {
      const result = await authApi.verifyMagicLink(token);

      setAuthTokenCookie(result.token);
      window.location.replace(result.redirect_to || redirectTo);
    } catch {
      setStatus('error');
    }
  };

  if (status === 'error') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          This sign-in link has expired or is invalid. Request a new one.
        </p>
        <a className="text-sm font-medium text-foreground underline" href="/auth/login">
          Return to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Your sign-in link is ready. Continue when you are ready to sign in.
      </p>
      <button
        type="button"
        onClick={verify}
        disabled={status === 'verifying'}
        className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60"
      >
        {status === 'verifying' ? 'Signing you in...' : 'Continue to sign in'}
      </button>
    </div>
  );
}
