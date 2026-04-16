import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { cartStore } from '../../stores/cart-store';
import { addressesApi, type Address } from '../../api/addresses';
import { checkoutApi, type ShippingMethod, type CheckoutInitPayload } from '../../api/checkout';
import { paymentsApi } from '../../api/payments';
import { ApiError } from '../../api/client';
import { formatMoney } from '../../lib/money';
import AddressForm from './address-form';

type Step = 'address' | 'shipping' | 'review' | 'processing';

export default function CheckoutFlow() {
  const cart = useStore(cartStore);

  const [step, setStep] = useState<Step>('address');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof checkoutApi.preview>> | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    addressesApi.list().then(setAddresses).catch(() => setAddresses([]));
  }, []);

  async function handleAddressSelect(address: Address) {
    setSelectedAddress(address);
    setError('');
    setLoading(true);
    try {
      const result = await checkoutApi.resolveShipping({
        country: address.country,
        city: address.city,
        region: address.region ?? undefined,
        cart_id: cart?.items[0] ? undefined : undefined,
      });
      setShippingMethods(result.shipping_methods);
      setSelectedMethod(result.shipping_methods[0] ?? null);
      setStep('shipping');
    } catch {
      setError('Could not load shipping methods. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleShippingConfirm() {
    if (!selectedAddress || !selectedMethod) return;
    setError('');
    setLoading(true);
    try {
      const result = await checkoutApi.preview(selectedAddress.id, selectedMethod.id);
      setPreview(result);
      setStep('review');
    } catch {
      setError('Could not calculate totals. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddress || !selectedMethod) return;
    setStep('processing');
    setError('');
    try {
      const payload: CheckoutInitPayload = {
        address_id: selectedAddress.id,
        shipping_method_id: selectedMethod.id,
        payment_provider: 'paystack',
        notes: notes || undefined,
      };
      const result = await checkoutApi.initialize(payload);
      window.location.href = result.payment.authorization_url;
    } catch (err) {
      if (err instanceof ApiError && err.status === 502) {
        // Order created but payment init failed — retry payment
        const orderId = (err.data as { order_id?: number } | null)?.order_id;
        if (orderId) {
          try {
            const payment = await paymentsApi.initialize(orderId);
            window.location.href = payment.authorization_url;
            return;
          } catch {
            // fall through to generic error
          }
        }
      }
      setError(
        err instanceof ApiError ? err.message : 'Checkout failed. Please try again.',
      );
      setStep('review');
    }
  }

  function handleAddressSaved(address: Address) {
    setAddresses((prev) => {
      const idx = prev.findIndex((a) => a.id === address.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = address;
        return next;
      }
      return [address, ...prev];
    });
    setShowAddressForm(false);
    handleAddressSelect(address);
  }

  // ── Step: Address ──────────────────────────────────────────────────────────
  if (step === 'address') {
    return (
      <div className="flex flex-col gap-6">
        <StepHeader step={1} label="Select delivery address" />

        {!showAddressForm && (
          <>
            {addresses.length === 0 ? (
              <p className="text-sm text-gray-500">No addresses saved yet. Add one below.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleAddressSelect(addr)}
                    disabled={loading}
                    className={[
                      'flex flex-col gap-0.5 rounded-xl border p-4 text-left text-sm transition hover:border-gray-400 disabled:opacity-60',
                      selectedAddress?.id === addr.id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200',
                    ].join(' ')}
                  >
                    <span className="font-medium text-gray-900">{addr.name}</span>
                    <span className="text-gray-500">{addr.address_line_1}</span>
                    <span className="text-gray-500">
                      {[addr.district, addr.city, addr.region].filter(Boolean).join(', ')}
                    </span>
                    {addr.phone && <span className="text-gray-400">{addr.phone}</span>}
                    {addr.is_default && (
                      <span className="mt-1 w-fit rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        Default
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAddressForm(true)}
              className="flex items-center gap-2 self-start text-sm font-medium text-gray-700 underline-offset-2 hover:underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add new address
            </button>
          </>
        )}

        {showAddressForm && (
          <AddressForm
            onSaved={handleAddressSaved}
            onCancel={() => setShowAddressForm(false)}
          />
        )}

        {loading && <p className="text-sm text-gray-400">Loading shipping options…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // ── Step: Shipping ─────────────────────────────────────────────────────────
  if (step === 'shipping') {
    return (
      <div className="flex flex-col gap-6">
        <StepHeader step={2} label="Choose shipping method" onBack={() => setStep('address')} />

        {shippingMethods.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
            No shipping methods available for this address. Please use a different address.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {shippingMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setSelectedMethod(method)}
                className={[
                  'flex items-start justify-between rounded-xl border p-4 text-left text-sm transition hover:border-gray-400',
                  selectedMethod?.id === method.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200',
                ].join(' ')}
              >
                <div>
                  <p className="font-medium text-gray-900">{method.name}</p>
                  <p className="text-gray-400">
                    {method.min_delivery_days}–{method.max_delivery_days} business days
                  </p>
                </div>
                <div className={[
                  'mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2',
                  selectedMethod?.id === method.id
                    ? 'border-gray-900 bg-gray-900'
                    : 'border-gray-300',
                ].join(' ')} />
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleShippingConfirm}
          disabled={!selectedMethod || loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-60"
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          Continue to review
        </button>
      </div>
    );
  }

  // ── Step: Review ───────────────────────────────────────────────────────────
  if (step === 'review' && preview) {
    const { totals, address, shipping_method } = preview;
    return (
      <div className="flex flex-col gap-6">
        <StepHeader step={3} label="Review your order" onBack={() => setStep('shipping')} />

        {/* Address summary */}
        <Section title="Delivering to">
          <p className="text-sm font-medium text-gray-900">{address.name}</p>
          <p className="text-sm text-gray-500">{address.address_line_1}</p>
          <p className="text-sm text-gray-500">
            {[address.district, address.city, address.region].filter(Boolean).join(', ')}
          </p>
        </Section>

        {/* Shipping summary */}
        <Section title="Shipping">
          <p className="text-sm text-gray-900">{shipping_method.name}</p>
          <p className="text-sm text-gray-500">
            {shipping_method.min_delivery_days}–{shipping_method.max_delivery_days} business days
          </p>
        </Section>

        {/* Totals */}
        <Section title="Order total">
          <div className="flex flex-col gap-2 text-sm">
            <Row label="Subtotal" value={formatMoney(totals.subtotal_amount)} />
            {totals.discount_amount > 0 && (
              <Row label="Discount" value={`-${formatMoney(totals.discount_amount)}`} className="text-green-600" />
            )}
            {totals.tax_amount > 0 && (
              <Row label="Tax" value={formatMoney(totals.tax_amount)} />
            )}
            <Row label="Shipping" value={formatMoney(totals.shipping_amount)} />
            <hr className="border-gray-100" />
            <Row label="Total" value={formatMoney(totals.total_amount)} bold />
          </div>
        </Section>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Order notes <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Leave at reception"
            rows={2}
            className="rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handlePlaceOrder}
          className="flex items-center justify-center rounded-xl bg-gray-900 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-700"
        >
          Place order & pay {formatMoney(totals.total_amount)}
        </button>

        <p className="text-center text-xs text-gray-400">
          You'll be redirected to Paystack to complete payment.
        </p>
      </div>
    );
  }

  // ── Step: Processing ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center">
      <svg className="h-10 w-10 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <p className="text-sm text-gray-500">Processing your order…</p>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────���───

function StepHeader({ step, label, onBack }: { step: number; label: string; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition hover:border-gray-400 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
      )}
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
        {step}
      </div>
      <h2 className="text-base font-semibold text-gray-900">{label}</h2>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  className = '',
}: {
  label: string;
  value: string;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={['flex justify-between', bold ? 'font-semibold text-gray-900' : 'text-gray-600', className].join(' ')}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
