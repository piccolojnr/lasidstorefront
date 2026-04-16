import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      await authApi.forgotPassword(email);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(
        err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      );
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="text-foreground h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <p className="text-foreground text-base font-semibold">Check your email</p>
          <p className="text-muted-foreground mt-1 text-sm">
            If that account exists, we've sent a password reset link to{' '}
            <span className="text-foreground font-medium">{email}</span>.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href="/auth/login">Back to sign in</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>

      {status === 'error' && (
        <p className="bg-destructive/10 text-destructive rounded-lg px-3.5 py-2.5 text-sm">{errorMsg}</p>
      )}

      <Button type="submit" disabled={status === 'loading'} className="w-full" size="lg">
        {status === 'loading' && (
          <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        Send reset link
      </Button>

      <Button variant="ghost" size="sm" asChild className="w-full">
        <a href="/auth/login">Back to sign in</a>
      </Button>
    </form>
  );
}
