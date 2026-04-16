import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cartStore } from '@/stores/cart-store';
import { sessionStore } from '@/stores/session-store';
import { cartApi } from '@/api/cart';
import { formatMoney } from '@/lib/money';
import { ROUTES } from '@/lib/constants';

export default function CartPage() {
  const cart = useStore(cartStore);
  const session = useStore(sessionStore);
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);

  if (cart === null && session.loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-muted h-24 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-24 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground/30 h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.962-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
        <div>
          <p className="text-foreground text-lg font-semibold">Your cart is empty</p>
          <p className="text-muted-foreground mt-1 text-sm">Add some products to get started.</p>
        </div>
        <Button asChild size="lg" className="mt-2">
          <a href={ROUTES.products}>Browse products</a>
        </Button>
      </div>
    );
  }

  async function handleQuantityChange(itemId: number, quantity: number) {
    if (quantity < 1) return;
    setLoadingItemId(itemId);
    try { await cartApi.updateItem(itemId, { quantity }); }
    finally { setLoadingItemId(null); }
  }

  async function handleRemove(itemId: number) {
    setLoadingItemId(itemId);
    try { await cartApi.removeItem(itemId); }
    finally { setLoadingItemId(null); }
  }

  const checkoutHref = session.authenticated
    ? ROUTES.checkout
    : `${ROUTES.authLogin}?redirect=${ROUTES.checkout}`;

  return (
    <div className="grid gap-10 lg:grid-cols-3 lg:items-start">
      {/* Item list */}
      <div className="flex flex-col divide-y lg:col-span-2">
        {cart.items.map((item) => {
          const isUpdating = loadingItemId === item.id;
          return (
            <div
              key={item.id}
              className={['flex gap-4 py-5 transition-opacity', isUpdating ? 'pointer-events-none opacity-50' : ''].join(' ')}
            >
              {/* Image placeholder */}
              <div className="bg-muted h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                <div className="text-muted-foreground/30 flex h-full items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-1">
                <p className="text-foreground text-sm font-medium leading-snug">{item.product_name_snapshot}</p>
                {item.variant_name_snapshot && <p className="text-muted-foreground text-xs">{item.variant_name_snapshot}</p>}
                <p className="text-muted-foreground text-xs">SKU: {item.sku_snapshot}</p>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="border-border flex items-center rounded-lg border">
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Decrease">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                      </svg>
                    </Button>
                    <span className="w-7 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleQuantityChange(item.id, item.quantity + 1)} aria-label="Increase">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-foreground text-sm font-semibold">{formatMoney(item.line_total)}</span>
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleRemove(item.id)} aria-label="Remove item" className="text-muted-foreground hover:text-destructive">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order summary */}
      <div className="border-border rounded-2xl border p-6">
        <h2 className="text-foreground mb-5 text-base font-semibold">Order summary</h2>
        <div className="flex flex-col gap-3 text-sm">
          <div className="text-muted-foreground flex justify-between">
            <span>Subtotal</span><span>{formatMoney(cart.subtotal_amount)}</span>
          </div>
          {cart.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span><span>-{formatMoney(cart.discount_amount)}</span>
            </div>
          )}
          {cart.tax_amount > 0 && (
            <div className="text-muted-foreground flex justify-between">
              <span>Tax</span><span>{formatMoney(cart.tax_amount)}</span>
            </div>
          )}
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>Shipping</span><span>Calculated at checkout</span>
          </div>
          <Separator />
          <div className="text-foreground flex justify-between font-semibold">
            <span>Total</span><span>{formatMoney(cart.total_amount)}</span>
          </div>
        </div>

        <Button asChild size="lg" className="mt-6 w-full">
          <a href={checkoutHref}>Proceed to checkout</a>
        </Button>
        <Button asChild variant="ghost" size="sm" className="mt-2 w-full">
          <a href={ROUTES.products}>Continue shopping</a>
        </Button>
      </div>
    </div>
  );
}
