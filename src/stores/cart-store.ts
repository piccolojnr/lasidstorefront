import { persistentAtom } from '@nanostores/persistent';
import { atom } from 'nanostores';
import { CART_TOKEN_KEY } from '../lib/constants';

export interface CartItem {
  id: number;
  product_id: number;
  product_variant_id: number | null;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  sku_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Cart {
  cart_token: string;
  status: string;
  currency_code: string;
  subtotal_amount: number;
  discount_amount: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  items: CartItem[];
}

/** Persisted cart token — survives page reloads. Sent via X-Cart-Token. */
export const cartToken = persistentAtom<string>(CART_TOKEN_KEY, '');

/** In-memory cart state — populated after fetching /api/v1/cart. */
export const cartStore = atom<Cart | null>(null);

/** Derived item count for nav badge. */
export function getCartItemCount(cart: Cart | null): number {
  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
