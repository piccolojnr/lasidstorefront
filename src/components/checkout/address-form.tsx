import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { addressesApi, type Address, type AddressPayload, type ShippingZoneSummary } from '@/api/addresses';
import { ApiError } from '@/api/client';

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
  shipping_zone_id: null,
  shipping_zone_area_id: null,
};

export default function AddressForm({ initial, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<AddressPayload>({ ...EMPTY, ...initial });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [zones, setZones] = useState<ShippingZoneSummary[]>([]);

  const isEdit = !!initial?.id;

  useEffect(() => {
    addressesApi.listZones().then(setZones).catch(() => setZones([]));
  }, []);

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

  function Field({
    id,
    label,
    required = false,
    type = 'text',
  }: {
    id: keyof AddressPayload;
    label: string;
    required?: boolean;
    type?: string;
  }) {
    const val = form[id] as string;
    const err = fieldErrors[id]?.[0];
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <Input
          id={id}
          type={type}
          value={val}
          onChange={(e) => set(id, e.target.value)}
          required={required}
          aria-invalid={!!err}
        />
        {err && <p className="text-destructive text-xs">{err}</p>}
      </div>
    );
  }

  const selectedZone = zones.find((z) => z.id === form.shipping_zone_id) ?? null;
  const areaOptions = selectedZone?.areas ?? [];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Field id="name" label="Full name" required />
        <Field id="phone" label="Phone" />
      </div>

      {/* Zone */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="shipping_zone_id">
          Shipping zone<span className="text-destructive ml-0.5">*</span>
        </Label>
        <Select
          id="shipping_zone_id"
          value={form.shipping_zone_id ?? ''}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null;
            setForm((f) => ({ ...f, shipping_zone_id: id, shipping_zone_area_id: null }));
          }}
          required
          aria-invalid={!!fieldErrors.shipping_zone_id?.[0]}
        >
          <option value="">— Select zone —</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </Select>
        {fieldErrors.shipping_zone_id?.[0] && (
          <p className="text-destructive text-xs">{fieldErrors.shipping_zone_id[0]}</p>
        )}
      </div>

      {/* Area — shown only once a zone is selected */}
      {selectedZone && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shipping_zone_area_id">Area</Label>
          <Select
            id="shipping_zone_area_id"
            value={form.shipping_zone_area_id ?? ''}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              setForm((f) => ({ ...f, shipping_zone_area_id: id }));
            }}
            aria-invalid={!!fieldErrors.shipping_zone_area_id?.[0]}
          >
            <option value="">— Select area —</option>
            {areaOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.area_name}
                {a.area_type !== 'country' ? ` (${a.area_type})` : ''}
              </option>
            ))}
          </Select>
          {fieldErrors.shipping_zone_area_id?.[0] && (
            <p className="text-destructive text-xs">{fieldErrors.shipping_zone_area_id[0]}</p>
          )}
        </div>
      )}

      <Field id="address_line_1" label="Address line 1" required />
      <Field id="address_line_2" label="Address line 2" />
      <div className="grid grid-cols-2 gap-4">
        <Field id="city" label="City" required />
        <Field id="district" label="District" />
      </div>
      <Field id="postal_code" label="Postal code" />
      <Field id="landmark" label="Landmark (optional)" />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => set('is_default', e.target.checked)}
          className="border-input rounded"
        />
        Set as default address
      </label>

      {status === 'error' && errorMsg && (
        <p className="bg-destructive/10 text-destructive rounded-lg px-3.5 py-2.5 text-sm">{errorMsg}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={status === 'loading'} size="lg" className="flex-1">
          {status === 'loading' && (
            <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {isEdit ? 'Save changes' : 'Add address'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
