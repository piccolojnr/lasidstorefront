import { useStore } from '@nanostores/react';
import { cartStore, getCartItemCount } from '../../stores/cart-store';

export default function CartCount() {
  const cart = useStore(cartStore);
  const count = getCartItemCount(cart);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}
