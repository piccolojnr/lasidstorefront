import { useState } from 'react';
import { authApi } from '../../api/auth';
import { ApiError } from '../../api/client';

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
      await authApi.resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmation,
      });
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
        <p className="text-base font-semibold text-gray-900">Password updated</p>
        <p className="text-sm text-gray-500">You can now sign in with your new password.</p>
        <a
          href="/auth/login"
          className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">New password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className={[
            'rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900',
            fieldErrors.password ? 'border-red-400' : 'border-gray-200',
          ].join(' ')}
        />
        {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmation" className="text-sm font-medium text-gray-700">Confirm password</label>
        <input
          id="confirmation"
          type="password"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          required
          autoComplete="new-password"
          className={[
            'rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900',
            fieldErrors.password_confirmation ? 'border-red-400' : 'border-gray-200',
          ].join(' ')}
        />
        {fieldErrors.password_confirmation && (
          <p className="text-xs text-red-500">{fieldErrors.password_confirmation[0]}</p>
        )}
      </div>

      {status === 'error' && !fieldErrors.password && (
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
        Reset password
      </button>
    </form>
  );
}
