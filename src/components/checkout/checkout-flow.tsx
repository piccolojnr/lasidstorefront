import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cartStore } from '@/stores/cart-store';
import { addressesApi, type Address } from '@/api/addresses';
import { checkoutApi, type ShippingMethod, type CheckoutInitPayload } from '@/api/checkout';
import { paymentsApi } from '@/api/payments';
import { ApiError } from '@/api/client';
import { formatMoney } from '@/lib/money';
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
      const payload = address.shipping_zone_id
        ? { shipping_zone_id: address.shipping_zone_id }
        : { country: address.country, city: address.city, region: address.region ?? undefined };

      const result = await checkoutApi.resolveShipping(payload);
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
              <p className="text-muted-foreground text-sm">No addresses saved yet. Add one below.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleAddressSelect(addr)}
                    disabled={loading}
                    className={[
                      'border-border hover:border-foreground/40 flex flex-col gap-0.5 rounded-xl border p-4 text-left text-sm transition disabled:opacity-60',
                      selectedAddress?.id === addr.id ? 'border-foreground bg-muted' : '',
                    ].join(' ')}
                  >
                    <span className="text-foreground font-medium">{addr.name}</span>
                    <span className="text-muted-foreground">{addr.address_line_1}</span>
                    <span className="text-muted-foreground">
                      {[addr.district, addr.city, addr.region].filter(Boolean).join(', ')}
                    </span>
                    {addr.shipping_zone && (
                      <span className="text-muted-foreground text-xs">{addr.shipping_zone.name}</span>
                    )}
                    {addr.phone && <span className="text-muted-foreground">{addr.phone}</span>}
                    {addr.is_default && (
                      <span className="bg-muted text-muted-foreground mt-1 w-fit rounded-full px-2 py-0.5 text-xs">Default</span>
                    )}
                    {!addr.shipping_zone_id && (
                      <span className="mt-1 w-fit rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        No shipping zone
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <Button variant="outline" size="sm" className="self-start" onClick={() => setShowAddressForm(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add new address
            </Button>
          </>
        )}

        {showAddressForm && (
          <AddressForm
            onSaved={handleAddressSaved}
            onCancel={() => setShowAddressForm(false)}
          />
        )}

        {loading && <p className="text-muted-foreground text-sm">Loading shipping options…</p>}
        {error && <p className="text-destructive text-sm">{error}</p>}
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
                  'border-border hover:border-foreground/40 flex items-start justify-between rounded-xl border p-4 text-left text-sm transition',
                  selectedMethod?.id === method.id ? 'border-foreground bg-muted' : '',
                ].join(' ')}
              >
                <div>
                  <p className="text-foreground font-medium">{method.name}</p>
                  <p className="text-muted-foreground">
                    {method.min_delivery_days}–{method.max_delivery_days} business days
                  </p>
                </div>
                <div className={[
                  'border-border mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2',
                  selectedMethod?.id === method.id ? 'border-foreground bg-foreground' : '',
                ].join(' ')} />
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button
          type="button"
          size="lg"
          onClick={handleShippingConfirm}
          disabled={!selectedMethod || loading}
          className="w-full"
        >
          {loading && (
            <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          Continue to review
        </Button>
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
          <p className="text-foreground text-sm font-medium">{address.name}</p>
          <p className="text-muted-foreground text-sm">{address.address_line_1}</p>
          <p className="text-muted-foreground text-sm">
            {[address.district, address.city, address.region].filter(Boolean).join(', ')}
          </p>
        </Section>

        {/* Shipping summary */}
        <Section title="Shipping">
          <p className="text-foreground text-sm">{shipping_method.name}</p>
          <p className="text-muted-foreground text-sm">
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
            <Separator />
            <Row label="Total" value={formatMoney(totals.total_amount)} bold />
          </div>
        </Section>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">
            Order notes{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Leave at reception"
            rows={2}
          />
        </div>

        {error && <p className="bg-destructive/10 text-destructive rounded-lg px-3.5 py-2.5 text-sm">{error}</p>}

        <Button type="button" size="lg" onClick={handlePlaceOrder} className="w-full">
          Place order & pay {formatMoney(totals.total_amount)}
        </Button>

        <p className="text-muted-foreground text-center text-xs">
          You'll be redirected to Paystack to complete payment.
        </p>
      </div>
    );
  }

  // ── Step: Processing ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-5 py-20 text-center">
      <svg className="text-muted-foreground h-10 w-10 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      <p className="text-muted-foreground text-sm">Processing your order…</p>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function StepHeader({ step, label, onBack }: { step: number; label: string; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <Button type="button" variant="outline" size="icon-sm" onClick={onBack} aria-label="Back">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Button>
      )}
      <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold">
        {step}
      </div>
      <h2 className="font-heading text-base font-semibold text-foreground">{label}</h2>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</p>
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
    <div className={['flex justify-between', bold ? 'font-semibold text-foreground' : 'text-muted-foreground', className].join(' ')}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
