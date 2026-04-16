import { useState } from 'react';
import { authApi } from '../../api/auth';
import { ApiError } from '../../api/client';

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
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900">Check your email</p>
          <p className="mt-1 text-sm text-gray-500">
            If that account exists, we've sent a password reset link to{' '}
            <span className="font-medium text-gray-700">{email}</span>.
          </p>
        </div>
        <a href="/auth/login" className="text-sm text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline">
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      {status === 'error' && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errorMsg}</p>
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
        Send reset link
      </button>

      <a href="/auth/login" className="text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
        Back to sign in
      </a>
    </form>
  );
}
