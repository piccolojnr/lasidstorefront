import { useState } from 'react';
import { authApi } from '../../api/auth';
import { ApiError } from '../../api/client';
import { ROUTES } from '../../lib/constants';

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

  // Magic link sent — show confirmation
  if (mode === 'magic-link' && status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">Check your email</p>
          <p className="mt-1 text-sm text-gray-500">
            We sent a sign-in link to <span className="font-medium text-gray-700">{email}</span>.
          </p>
          <p className="mt-1 text-xs text-gray-400">The link expires shortly. Check your spam folder if it doesn't arrive.</p>
        </div>
        <button
          type="button"
          onClick={() => { setStatus('idle'); setEmail(''); }}
          className="text-sm text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Mode toggle */}
      <div className="flex rounded-xl border border-gray-200 p-1">
        {(['magic-link', 'password'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); resetState(); }}
            className={[
              'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
              mode === m
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900',
            ].join(' ')}
          >
            {m === 'magic-link' ? 'Magic link' : 'Password'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form
        onSubmit={mode === 'magic-link' ? handleMagicLink : handlePassword}
        className="flex flex-col gap-4"
      >
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={[
              'rounded-xl border px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900',
              fieldErrors.email ? 'border-red-400' : 'border-gray-200',
            ].join(' ')}
          />
          {fieldErrors.email && (
            <p className="text-xs text-red-500">{fieldErrors.email[0]}</p>
          )}
        </div>

        {/* Password field (password mode only) */}
        {mode === 'password' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <a
                href="/auth/forgot-password"
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={[
                'rounded-xl border px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900',
                fieldErrors.password ? 'border-red-400' : 'border-gray-200',
              ].join(' ')}
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-500">{fieldErrors.password[0]}</p>
            )}
          </div>
        )}

        {/* Top-level error */}
        {status === 'error' && errorMsg && !fieldErrors.email && !fieldErrors.password && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60"
        >
          {status === 'loading' && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {mode === 'magic-link' ? 'Send sign-in link' : 'Sign in'}
        </button>
      </form>

      {mode === 'magic-link' && (
        <p className="text-center text-xs text-gray-400">
          We'll email you a magic link — no password needed.
        </p>
      )}
    </div>
  );
}
