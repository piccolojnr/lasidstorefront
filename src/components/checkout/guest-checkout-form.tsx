import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { addressesApi, type ShippingZoneSummary } from '@/api/addresses';
import { checkoutApi, type GuestCheckoutPayload, type ShippingMethod } from '@/api/checkout';
import { ApiError } from '@/api/client';
import AddressFields, { type AddressFieldsValue } from './address-fields';

interface Props {
  onResolved: (data: Omit<GuestCheckoutPayload, 'shipping_method_id' | 'payment_provider'>, methods: ShippingMethod[]) => void;
}

type FormData = Omit<GuestCheckoutPayload, 'shipping_method_id' | 'payment_provider'>;
type GuestFormState = AddressFieldsValue & { email: string };

const EMPTY: GuestFormState = {
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
  const [form, setForm] = useState<GuestFormState>(EMPTY);
  const [zones, setZones] = useState<ShippingZoneSummary[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    addressesApi.listZones().then(setZones).catch(() => setZones([]));
  }, []);

  function setField<K extends keyof AddressFieldsValue>(
    key: K,
    value: AddressFieldsValue[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      return { ...current, [key]: [] };
    });
  }

  async function handleSubmit(event: { preventDefault(): void }) {
    event.preventDefault();
    setStatus('loading');
    setFieldErrors({});
    setErrorMsg('');

    try {
      const payload = form.shipping_zone_id
        ? { shipping_zone_id: form.shipping_zone_id }
        : {
            country: form.country || 'GH',
            city: form.city || '',
            region: form.region || undefined,
          };

      const result = await checkoutApi.resolveShipping(payload);

      if (result.shipping_methods.length === 0) {
        setStatus('error');
        setErrorMsg('No shipping methods are available for this location yet. Try a different zone or update the address details.');
        return;
      }

      setStatus('idle');
      const normalizedForm: FormData = {
        ...form,
        phone: form.phone || undefined,
        region: form.region || undefined,
        district: form.district || undefined,
        address_line_2: form.address_line_2 || undefined,
        landmark: form.landmark || undefined,
        postal_code: form.postal_code || undefined,
      };
      onResolved(normalizedForm, result.shipping_methods);
    } catch (error) {
      setStatus('error');
      if (error instanceof ApiError) {
        setFieldErrors(error.errors ?? {});
        setErrorMsg(error.message);
      } else {
        setErrorMsg('Could not load shipping methods. Please try again.');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <AddressFields
        form={form}
        fieldErrors={fieldErrors}
        zones={zones}
        showEmail
        disabled={status === 'loading'}
        onFieldChange={setField}
      />

      {status === 'error' && errorMsg && (
        <p className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
          {errorMsg}
        </p>
      )}

      <div className="border-t border-border pt-4">
        <Button type="submit" size="lg" disabled={status === 'loading'} className="w-full">
          {status === 'loading' ? 'Checking shipping options…' : 'Continue to shipping'}
        </Button>
      </div>
    </form>
  );
}
