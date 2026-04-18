import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { addressesApi, type Address, type AddressPayload, type ShippingZoneSummary } from '@/api/addresses';
import { ApiError } from '@/api/client';
import AddressFields, { type AddressFieldsValue } from './address-fields';

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

type AddressFormState = AddressFieldsValue & {
  type: 'shipping' | 'billing';
  is_default: boolean;
};

function toFormState(initial?: Partial<Address>): AddressFormState {
  return {
    ...EMPTY,
    ...initial,
    phone: initial?.phone ?? '',
    region: initial?.region ?? '',
    district: initial?.district ?? '',
    address_line_2: initial?.address_line_2 ?? '',
    landmark: initial?.landmark ?? '',
    postal_code: initial?.postal_code ?? '',
  };
}

export default function AddressForm({ initial, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<AddressFormState>(toFormState(initial));
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [errorMsg, setErrorMsg] = useState('');
  const [zones, setZones] = useState<ShippingZoneSummary[]>([]);

  const isEdit = !!initial?.id;

  useEffect(() => {
    setForm(toFormState(initial));
    setFieldErrors({});
    setErrorMsg('');
    setStatus('idle');
  }, [initial]);

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
      const payload: AddressPayload = {
        ...form,
        phone: form.phone || null,
        region: form.region || null,
        district: form.district || null,
        address_line_2: form.address_line_2 || null,
        landmark: form.landmark || null,
        postal_code: form.postal_code || null,
      };
      const saved = isEdit
        ? await addressesApi.update(initial!.id!, payload)
        : await addressesApi.create(payload);
      onSaved(saved);
    } catch (error) {
      setStatus('error');
      if (error instanceof ApiError) {
        setFieldErrors(error.errors ?? {});
        setErrorMsg(error.message);
      } else {
        setErrorMsg('Could not save address. Please try again.');
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <AddressFields
        form={form}
        fieldErrors={fieldErrors}
        zones={zones}
        showDefaultToggle
        disabled={status === 'loading'}
        onFieldChange={setField}
      />

      {status === 'error' && errorMsg && (
        <p className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm">
          {errorMsg}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={status === 'loading'}>
          {status === 'loading' ? 'Saving…' : isEdit ? 'Save changes' : 'Add address'}
        </Button>
      </div>
    </form>
  );
}
