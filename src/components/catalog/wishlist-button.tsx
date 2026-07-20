"use client";

import * as React from "react";
import { useStore } from "@nanostores/react";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { wishlistStore, toggleWishlist } from "@/stores/wishlist-store";

type Props = {
  productId: number;
};

export default function WishlistButton({ productId }: Props) {
  const ids = useStore(wishlistStore);
  const isSaved = ids.includes(productId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  }

  const Icon = isSaved ? IconHeartFilled : IconHeart;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-full border bg-background/95 text-muted-foreground shadow-sm transition-colors",
        "hover:border-foreground/20 hover:text-foreground",
        isSaved && "border-destructive/30 text-destructive",
      )}
      aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={isSaved}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}
