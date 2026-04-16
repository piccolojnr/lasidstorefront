import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartStore } from '../../stores/cart-store';
import { sessionStore } from '../../stores/session-store';
import { cartApi } from '../../api/cart';
import { formatMoney } from '../../lib/money';
import { ROUTES } from '../../lib/constants';

export default function CartPage() {
  const cart = useStore(cartStore);
  const session = useStore(sessionStore);
  const [loadingItemId, setLoadingItemId] = useState<number | null>(null);

  // Still bootstrapping
  if (cart === null && session.loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  // Empty cart
  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-24 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.962-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
        <div>
          <p className="text-lg font-semibold text-gray-900">Your cart is empty</p>
          <p className="mt-1 text-sm text-gray-500">Add some products to get started.</p>
        </div>
        <a
          href={ROUTES.products}
          className="mt-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
        >
          Browse products
        </a>
      </div>
    );
  }

  async function handleQuantityChange(itemId: number, quantity: number) {
    if (quantity < 1) return;
    setLoadingItemId(itemId);
    try {
      await cartApi.updateItem(itemId, { quantity });
    } finally {
      setLoadingItemId(null);
    }
  }

  async function handleRemove(itemId: number) {
    setLoadingItemId(itemId);
    try {
      await cartApi.removeItem(itemId);
    } finally {
      setLoadingItemId(null);
    }
  }

  const checkoutHref = session.authenticated
    ? ROUTES.checkout
    : `${ROUTES.authLogin}?redirect=${ROUTES.checkout}`;

  return (
    <div className="grid gap-10 lg:grid-cols-3 lg:items-start">
      {/* Item list */}
      <div className="flex flex-col divide-y divide-gray-100 lg:col-span-2">
        {cart.items.map((item) => {
          const isUpdating = loadingItemId === item.id;
          return (
            <div
              key={item.id}
              className={[
                'flex gap-4 py-5 transition-opacity',
                isUpdating ? 'opacity-50 pointer-events-none' : '',
              ].join(' ')}
            >
              {/* Image placeholder */}
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <div className="flex h-full items-center justify-center text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-sm font-medium text-gray-900 leading-snug">
                  {item.product_name_snapshot}
                </p>
                {item.variant_name_snapshot && (
                  <p className="text-xs text-gray-400">{item.variant_name_snapshot}</p>
                )}
                <p className="text-xs text-gray-400">SKU: {item.sku_snapshot}</p>

                <div className="mt-auto flex items-center justify-between pt-2">
                  {/* Quantity stepper */}
                  <div className="flex items-center rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="flex h-8 w-8 items-center justify-center text-gray-500 transition hover:bg-gray-50 disabled:opacity-40"
                      aria-label="Decrease"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="w-7 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center text-gray-500 transition hover:bg-gray-50"
                      aria-label="Increase"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>

                  {/* Line total + remove */}
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatMoney(item.line_total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="text-gray-300 transition hover:text-red-500"
                      aria-label="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order summary */}
      <div className="rounded-2xl border border-gray-100 p-6">
        <h2 className="mb-5 text-base font-semibold text-gray-900">Order summary</h2>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatMoney(cart.subtotal_amount)}</span>
          </div>
          {cart.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatMoney(cart.discount_amount)}</span>
            </div>
          )}
          {cart.tax_amount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>{formatMoney(cart.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-500 text-xs">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <hr className="border-gray-100" />
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>{formatMoney(cart.total_amount)}</span>
          </div>
        </div>

        <a
          href={checkoutHref}
          className="mt-6 flex w-full items-center justify-center rounded-xl bg-gray-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-700"
        >
          Proceed to checkout
        </a>
        <a
          href={ROUTES.products}
          className="mt-3 flex w-full items-center justify-center text-sm text-gray-400 transition hover:text-gray-600"
        >
          Continue shopping
        </a>
      </div>
    </div>
  );
}
