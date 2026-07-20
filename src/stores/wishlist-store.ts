import { persistentAtom } from '@nanostores/persistent';
import { computed } from 'nanostores';

const WISHLIST_KEY = 'wishlist_products';

/** Persisted list of saved product IDs — survives page reloads. */
export const wishlistStore = persistentAtom<number[]>(WISHLIST_KEY, [], {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item) => typeof item === 'number')
        : [];
    } catch {
      return [];
    }
  },
});

/** Derived count for the nav badge. */
export const wishlistCount = computed(wishlistStore, (ids) => ids.length);

/** Toggle a product in/out of the wishlist. */
export function toggleWishlist(productId: number): void {
  const current = wishlistStore.get();
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  wishlistStore.set(next);
}

/** Check if a product is in the wishlist. */
export function isInWishlist(productId: number): boolean {
  return wishlistStore.get().includes(productId);
}
