import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sessionStore } from '@/stores/session-store';
import { profileApi, type ProfileUpdatePayload } from '@/api/profile';
import { ApiError } from '@/api/client';

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

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!fieldErrors.name} />
        {fieldErrors.name && <p className="text-destructive text-xs">{fieldErrors.name[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!fieldErrors.phone} />
        {fieldErrors.phone && <p className="text-destructive text-xs">{fieldErrors.phone[0]}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!fieldErrors.email} />
        {fieldErrors.email && <p className="text-destructive text-xs">{fieldErrors.email[0]}</p>}
        {email !== (user?.email ?? '') && (
          <p className="text-xs text-amber-600">Changing your email will require re-verification.</p>
        )}
      </div>

      <hr className="border-border" />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">
          New password{' '}
          <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>
        </Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" aria-invalid={!!fieldErrors.password} />
        {fieldErrors.password && <p className="text-destructive text-xs">{fieldErrors.password[0]}</p>}
      </div>

      {password && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmation">Confirm new password</Label>
          <Input id="confirmation" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" />
        </div>
      )}

      {status === 'error' && errorMsg && (
        <p className="bg-destructive/10 text-destructive rounded-lg px-3.5 py-2.5 text-sm">{errorMsg}</p>
      )}
      {status === 'success' && (
        <p className="rounded-lg bg-green-50 px-3.5 py-2.5 text-sm text-green-700">Profile updated successfully.</p>
      )}

      <Button type="submit" disabled={status === 'loading'} size="lg" className="self-start">
        {status === 'loading' && (
          <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        Save changes
      </Button>
    </form>
  );
}
