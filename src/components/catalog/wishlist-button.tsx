"use client";

import * as React from "react";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

import { cn } from "@/lib/utils";

type Props = {
  productId: number;
};

const WISHLIST_KEY = "wishlist_products";

function readWishlist(): number[] {
  try {
    const raw = window.localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "number")
      : [];
  } catch {
    return [];
  }
}

export default function WishlistButton({ productId }: Props) {
  const [isSaved, setIsSaved] = React.useState(false);

  React.useEffect(() => {
    setIsSaved(readWishlist().includes(productId));
  }, [productId]);

  function toggleWishlist() {
    const current = readWishlist();
    const next = current.includes(productId)
      ? current.filter((item) => item !== productId)
      : [...current, productId];

    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    setIsSaved(next.includes(productId));
  }

  const Icon = isSaved ? IconHeartFilled : IconHeart;

  return (
    <button
      type="button"
      onClick={toggleWishlist}
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
