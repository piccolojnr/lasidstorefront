import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cartStore } from '@/stores/cart-store';
import { sessionStore } from '@/stores/session-store';
import { addressesApi, type Address } from '@/api/addresses';
import { checkoutApi, type ShippingMethod, type CheckoutInitPayload, type GuestCheckoutPayload } from '@/api/checkout';
import { paymentsApi } from '@/api/payments';
import { ApiError } from '@/api/client';
import { formatMoney } from '@/lib/money';
import AddressForm from './address-form';
import GuestCheckoutForm from './guest-checkout-form';

type Step = 'gate' | 'guest-form' | 'address' | 'shipping' | 'review' | 'processing';

export default function CheckoutFlow() {
  const cart = useStore(cartStore);
  const session = useStore(sessionStore);

  const [step, setStep] = useState<Step>('gate');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof checkoutApi.preview>> | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestData, setGuestData] = useState<Omit<GuestCheckoutPayload, 'shipping_method_id' | 'payment_provider'> | null>(null);

  // Once session resolves, route to the right starting step
  useEffect(() => {
    if (session.loading) return;
    if (session.authenticated) {
      setStep('address');
      addressesApi.list().then(setAddresses).catch(() => setAddresses([]));
    }
    // unauthenticated stays at 'gate'
  }, [session.loading, session.authenticated]);

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
    if (!selectedMethod) return;
    setError('');

    // Guests have no saved address — skip the preview API call
    if (isGuest) {
      setStep('review');
      return;
    }

    if (!selectedAddress) return;
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
    if (!selectedMethod) return;
    setStep('processing');
    setError('');
    try {
      let authorizationUrl: string;

      if (isGuest && guestData) {
        const result = await checkoutApi.initializeGuest({
          ...guestData,
          shipping_method_id: selectedMethod.id,
          payment_provider: 'paystack',
          notes: notes || undefined,
        });
        authorizationUrl = result.payment.authorization_url;
      } else {
        if (!selectedAddress) return;
        const payload: CheckoutInitPayload = {
          address_id: selectedAddress.id,
          shipping_method_id: selectedMethod.id,
          payment_provider: 'paystack',
          notes: notes || undefined,
        };
        const result = await checkoutApi.initialize(payload);
        authorizationUrl = result.payment.authorization_url;
      }

      window.location.href = authorizationUrl;
    } catch (err) {
      if (!isGuest && err instanceof ApiError && err.status === 502) {
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

  function handleGuestResolved(
    data: Omit<GuestCheckoutPayload, 'shipping_method_id' | 'payment_provider'>,
    methods: ShippingMethod[],
  ) {
    setIsGuest(true);
    setGuestData(data);
    setShippingMethods(methods);
    setSelectedMethod(methods[0] ?? null);
    setStep('shipping');
  }

  // ── Session loading ────────────────────────────────────────────────────────
  if (session.loading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-muted h-16 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Step: Gate ─────────────────────────────────────────────────────────────
  if (step === 'gate') {
    return (
      <div className="flex flex-col gap-6">
        <StepHeader step={1} label="How would you like to continue?" />

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setStep('guest-form')}
            className="border-border hover:border-foreground/40 flex flex-col gap-1 rounded-xl border p-5 text-left transition"
          >
            <span className="text-foreground font-medium">Continue as guest</span>
            <span className="text-muted-foreground text-sm">No account needed. We'll email you a link to track your order.</span>
          </button>

          <a
            href={`/auth/login?redirect=/checkout`}
            className="border-border hover:border-foreground/40 flex flex-col gap-1 rounded-xl border p-5 text-left transition"
          >
            <span className="text-foreground font-medium">Sign in or create account</span>
            <span className="text-muted-foreground text-sm">Access saved addresses and order history.</span>
          </a>
        </div>
      </div>
    );
  }

  // ── Step: Guest form ───────────────────────────────────────────────────────
  if (step === 'guest-form') {
    return (
      <div className="flex flex-col gap-6">
        <StepHeader step={1} label="Your details" onBack={() => setStep('gate')} />
        <GuestCheckoutForm onResolved={handleGuestResolved} />
      </div>
    );
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
        <StepHeader step={2} label="Choose shipping method" onBack={() => setStep(isGuest ? 'guest-form' : 'address')} />

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
  if (step === 'review' && selectedMethod) {
    // Derive address summary + totals from either the server preview (auth) or local state (guest)
    const reviewAddress = isGuest && guestData
      ? { name: guestData.name, address_line_1: guestData.address_line_1, district: guestData.district, city: guestData.city, region: guestData.region }
      : preview?.address;

    const subtotal = isGuest ? (cart?.subtotal_amount ?? 0) : (preview?.totals.subtotal_amount ?? 0);
    const discount = isGuest ? (cart?.discount_amount ?? 0) : (preview?.totals.discount_amount ?? 0);
    const tax      = isGuest ? (cart?.tax_amount ?? 0) : (preview?.totals.tax_amount ?? 0);
    const shipping = isGuest ? (selectedMethod.shipping_amount ?? 0) : (preview?.totals.shipping_amount ?? 0);
    const total    = subtotal + shipping - discount + tax;

    if (!reviewAddress) return null;

    return (
      <div className="flex flex-col gap-6">
        <StepHeader step={3} label="Review your order" onBack={() => setStep('shipping')} />

        {/* Address summary */}
        <Section title="Delivering to">
          <p className="text-foreground text-sm font-medium">{reviewAddress.name}</p>
          <p className="text-muted-foreground text-sm">{reviewAddress.address_line_1}</p>
          <p className="text-muted-foreground text-sm">
            {[reviewAddress.district, reviewAddress.city, reviewAddress.region].filter(Boolean).join(', ')}
          </p>
        </Section>

        {/* Shipping summary */}
        <Section title="Shipping">
          <p className="text-foreground text-sm">{selectedMethod.name}</p>
          <p className="text-muted-foreground text-sm">
            {selectedMethod.min_delivery_days}–{selectedMethod.max_delivery_days} business days
          </p>
        </Section>

        {/* Totals */}
        <Section title="Order total">
          <div className="flex flex-col gap-2 text-sm">
            <Row label="Subtotal" value={formatMoney(subtotal)} />
            {discount > 0 && (
              <Row label="Discount" value={`-${formatMoney(discount)}`} className="text-green-600" />
            )}
            {tax > 0 && (
              <Row label="Tax" value={formatMoney(tax)} />
            )}
            <Row label="Shipping" value={formatMoney(shipping)} />
            <Separator />
            <Row label="Total" value={formatMoney(total)} bold />
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
          Place order & pay {formatMoney(total)}
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
