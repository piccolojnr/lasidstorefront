import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { sessionStore } from '../../stores/session-store';
import { profileApi, type ProfileUpdatePayload } from '../../api/profile';
import { ApiError } from '../../api/client';

export default function ProfileForm() {
  const session = useStore(sessionStore);
  const user = session.user;

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setStatus('loading');
    setFieldErrors({});
    setErrorMsg('');

    const payload: ProfileUpdatePayload = {};
    if (name !== (user?.name ?? '')) payload.name = name;
    if (phone !== (user?.phone ?? '')) payload.phone = phone;
    if (email !== (user?.email ?? '')) payload.email = email;
    if (password) {
      payload.password = password;
      payload.password_confirmation = confirmation;
    }

    try {
      await profileApi.update(payload);
      setStatus('success');
      setPassword('');
      setConfirmation('');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiError) {
        setFieldErrors(err.errors ?? {});
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Could not update profile. Please try again.');
      }
    }
  }

  function fieldClass(key: string) {
    return [
      'rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900',
      fieldErrors[key] ? 'border-red-400' : 'border-gray-200',
    ].join(' ');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">Full name</label>
        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass('name')} />
        {fieldErrors.name && <p className="text-xs text-red-500">{fieldErrors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</label>
        <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass('phone')} />
        {fieldErrors.phone && <p className="text-xs text-red-500">{fieldErrors.phone[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass('email')} />
        {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email[0]}</p>}
        {email !== (user?.email ?? '') && (
          <p className="text-xs text-amber-600">Changing your email will require re-verification.</p>
        )}
      </div>

      <hr className="border-gray-100" />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          New password <span className="font-normal text-gray-400">(leave blank to keep current)</span>
        </label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={fieldClass('password')} />
        {fieldErrors.password && <p className="text-xs text-red-500">{fieldErrors.password[0]}</p>}
      </div>

      {password && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmation" className="text-sm font-medium text-gray-700">Confirm new password</label>
          <input id="confirmation" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" className={fieldClass('password_confirmation')} />
        </div>
      )}

      {status === 'error' && errorMsg && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errorMsg}</p>
      )}
      {status === 'success' && (
        <p className="rounded-lg bg-green-50 px-3.5 py-2.5 text-sm text-green-700">Profile updated successfully.</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60 self-start px-6"
      >
        {status === 'loading' && (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        Save changes
      </button>
    </form>
  );
}
