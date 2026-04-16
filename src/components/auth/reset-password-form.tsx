import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';

interface Props {
  token: string;
  email: string;
}

export default function ResetPasswordForm({ token, email }: Props) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    setFieldErrors({});
    try {
      await authApi.resetPassword({ token, email, password, password_confirmation: confirmation });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiError) {
        setFieldErrors(err.errors ?? {});
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <p className="text-foreground text-base font-semibold">Password updated</p>
        <p className="text-muted-foreground text-sm">You can now sign in with your new password.</p>
        <Button asChild size="lg">
          <a href="/auth/login">Sign in</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          aria-invalid={!!fieldErrors.password}
        />
        {fieldErrors.password && <p className="text-destructive text-xs">{fieldErrors.password[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmation">Confirm password</Label>
        <Input
          id="confirmation"
          type="password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          required
          autoComplete="new-password"
          aria-invalid={!!fieldErrors.password_confirmation}
        />
        {fieldErrors.password_confirmation && (
          <p className="text-destructive text-xs">{fieldErrors.password_confirmation[0]}</p>
        )}
      </div>

      {status === 'error' && !fieldErrors.password && (
        <p className="bg-destructive/10 text-destructive rounded-lg px-3.5 py-2.5 text-sm">{errorMsg}</p>
      )}

      <Button type="submit" disabled={status === 'loading'} className="w-full" size="lg">
        {status === 'loading' && (
          <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        Reset password
      </Button>
    </form>
  );
}
