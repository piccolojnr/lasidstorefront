import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/api/auth';
import { ApiError } from '@/api/client';
import { ROUTES } from '@/lib/constants';

type Mode = 'magic-link' | 'password';

interface Props {
  redirectTo?: string;
}

export default function LoginForm({ redirectTo = ROUTES.accountOrders }: Props) {
  const [mode, setMode] = useState<Mode>('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function resetState() {
    setStatus('idle');
    setErrorMsg('');
    setFieldErrors({});
  }

  async function handleMagicLink(e: { preventDefault(): void }) {
    e.preventDefault();
    resetState();
    setStatus('loading');
    try {
      await authApi.requestMagicLink(email, redirectTo);
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

  async function handlePassword(e: { preventDefault(): void }) {
    e.preventDefault();
    resetState();
    setStatus('loading');
    try {
      await authApi.loginWithPassword(email, password);
      window.location.href = redirectTo;
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

  if (mode === 'magic-link' && status === 'success') {
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
            We sent a sign-in link to <span className="text-foreground font-medium">{email}</span>.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">The link expires shortly. Check your spam folder if it doesn't arrive.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setStatus('idle'); setEmail(''); }}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Mode toggle */}
      <div className="border-border flex rounded-xl border p-1">
        {(['magic-link', 'password'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); resetState(); }}
            className={[
              'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
              mode === m
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {m === 'magic-link' ? 'Magic link' : 'Password'}
          </button>
        ))}
      </div>

      <form
        onSubmit={mode === 'magic-link' ? handleMagicLink : handlePassword}
        className="flex flex-col gap-4"
      >
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
            aria-invalid={!!fieldErrors.email}
          />
          {fieldErrors.email && <p className="text-destructive text-xs">{fieldErrors.email[0]}</p>}
        </div>

        {mode === 'password' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="/auth/forgot-password" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && <p className="text-destructive text-xs">{fieldErrors.password[0]}</p>}
          </div>
        )}

        {status === 'error' && errorMsg && !fieldErrors.email && !fieldErrors.password && (
          <p className="bg-destructive/10 text-destructive rounded-lg px-3.5 py-2.5 text-sm">{errorMsg}</p>
        )}

        <Button type="submit" disabled={status === 'loading'} className="w-full" size="lg">
          {status === 'loading' && (
            <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {mode === 'magic-link' ? 'Send sign-in link' : 'Sign in'}
        </Button>
      </form>

      {mode === 'magic-link' && (
        <p className="text-muted-foreground text-center text-xs">
          We'll email you a magic link — no password needed.
        </p>
      )}
    </div>
  );
}
