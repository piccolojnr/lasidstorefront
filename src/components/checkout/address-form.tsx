import { useState } from 'react';
import { addressesApi, type Address, type AddressPayload } from '../../api/addresses';
import { ApiError } from '../../api/client';

interface Props {
  initial?: Partial<Address>;
  onSaved: (address: Address) => void;
  onCancel: () => void;
}

const EMPTY: AddressPayload = {
  type: 'shipping',
  name: '',
  phone: '',
  country: 'GH',
  region: '',
  city: '',
  district: '',
  address_line_1: '',
  address_line_2: '',
  landmark: '',
  postal_code: '',
  is_default: false,
};

export default function AddressForm({ initial, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<AddressPayload>({ ...EMPTY, ...initial });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [errorMsg, setErrorMsg] = useState('');

  const isEdit = !!initial?.id;

  function set(key: keyof AddressPayload, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setStatus('loading');
    setFieldErrors({});
    setErrorMsg('');
    try {
      const saved = isEdit
        ? await addressesApi.update(initial!.id!, form)
        : await addressesApi.create(form);
      onSaved(saved);
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiError) {
        setFieldErrors(err.errors ?? {});
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Could not save address. Please try again.');
      }
    }
  }

  function field(id: keyof AddressPayload, label: string, required = false, type = 'text') {
    const val = form[id] as string;
    const err = fieldErrors[id]?.[0];
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <input
          id={id}
          type={type}
          value={val}
          onChange={(e) => set(id, e.target.value)}
          required={required}
          className={[
            'rounded-xl border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900',
            err ? 'border-red-400' : 'border-gray-200',
          ].join(' ')}
        />
        {err && <p className="text-xs text-red-500">{err}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {field('name', 'Full name', true)}
        {field('phone', 'Phone')}
      </div>
      {field('address_line_1', 'Address line 1', true)}
      {field('address_line_2', 'Address line 2')}
      <div className="grid grid-cols-2 gap-4">
        {field('city', 'City', true)}
        {field('district', 'District')}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {field('region', 'Region')}
        {field('postal_code', 'Postal code')}
      </div>
      {field('landmark', 'Landmark (optional)')}

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => set('is_default', e.target.checked)}
          className="rounded border-gray-300"
        />
        Set as default address
      </label>

      {status === 'error' && errorMsg && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{errorMsg}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60"
        >
          {status === 'loading' && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {isEdit ? 'Save changes' : 'Add address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
