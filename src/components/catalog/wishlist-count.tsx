import { useStore } from "@nanostores/react";
import { wishlistCount } from "../../stores/wishlist-store";

export default function WishlistCount() {
  const count = useStore(wishlistCount);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
