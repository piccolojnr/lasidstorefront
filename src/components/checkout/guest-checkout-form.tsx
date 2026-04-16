import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { addressesApi, type ShippingZoneSummary } from '@/api/addresses';
import { checkoutApi, type GuestCheckoutPayload, type ShippingMethod } from '@/api/checkout';
import { ApiError } from '@/api/client';

interface Props {
  onResolved: (data: Omit<GuestCheckoutPayload, 'shipping_method_id' | 'payment_provider'>, methods: ShippingMethod[]) => void;
}

type FormData = Omit<GuestCheckoutPayload, 'shipping_method_id' | 'payment_provider'>;

const EMPTY: FormData = {
  email: '',
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
  shipping_zone_id: null,
  shipping_zone_area_id: null,
};

export default function GuestCheckoutForm({ onResolved }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [zones, setZones] = useState<ShippingZoneSummary[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    addressesApi.listZones().then(setZones).catch(() => setZones([]));
  }, []);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const selectedZone = zones.find((z) => z.id === form.shipping_zone_id) ?? null;
  const areaOptions = selectedZone?.areas ?? [];

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setStatus('loading');
    setFieldErrors({});
    setErrorMsg('');
    try {
      const payload = form.shipping_zone_id
        ? { shipping_zone_id: form.shipping_zone_id }
        : { country: form.country || 'GH', city: form.city || '', region: form.region || undefined };

      const result = await checkoutApi.resolveShipping(payload);

      if (result.shipping_methods.length === 0) {
        setStatus('error');
        setErrorMsg('No shipping methods available for this location. Please check your zone selection.');
        return;
      }

      setStatus('idle');
      onResolved(form, result.shipping_methods);
    } catch (err) {
      setStatus('error');
      if (err instanceof ApiError) {
        setFieldErrors(err.errors ?? {});
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Could not load shipping methods. Please try again.');
      }
    }
  }

  function Field({
    id,
    label,
    required = false,
    type = 'text',
  }: {
    id: keyof FormData;
    label: string;
    required?: boolean;
    type?: string;
  }) {
    const val = (form[id] ?? '') as string;
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
          onChange={(e) => set(id, e.target.value as FormData[typeof id])}
          required={required}
          aria-invalid={!!err}
        />
        {err && <p className="text-destructive text-xs">{err}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Contact */}
      <div className="grid grid-cols-2 gap-4">
        <Field id="name" label="Full name" required />
        <Field id="phone" label="Phone" />
      </div>
      <Field id="email" label="Email" required type="email" />

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

      {selectedZone && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shipping_zone_area_id">Area</Label>
          <Select
            id="shipping_zone_area_id"
            value={form.shipping_zone_area_id ?? ''}
            onChange={(e) => {
              const id = e.target.value ? Number(e.target.value) : null;
              set('shipping_zone_area_id', id);
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

      {/* Address */}
      <Field id="address_line_1" label="Address line 1" required />
      <Field id="address_line_2" label="Address line 2" />
      <div className="grid grid-cols-2 gap-4">
        <Field id="city" label="City" required />
        <Field id="district" label="District" />
      </div>
      <Field id="postal_code" label="Postal code" />
      <Field id="landmark" label="Landmark (optional)" />

      {status === 'error' && errorMsg && (
        <p className="bg-destructive/10 text-destructive rounded-lg px-3.5 py-2.5 text-sm">{errorMsg}</p>
      )}

      <Button type="submit" disabled={status === 'loading'} size="lg" className="w-full">
        {status === 'loading' && (
          <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        Continue to shipping
      </Button>
    </form>
  );
}
