"use client";

import { useState } from "react";
import { IconShoppingBagPlus } from "@tabler/icons-react";

import { cartApi } from "@/api/cart";
import { Button } from "@/components/ui/button";

interface Props {
  productId: number;
  productSlug: string;
  hasVariants: boolean;
  disabled?: boolean;
  label?: string;
}

export default function CardAddToCartButton({
  productId,
  productSlug,
  hasVariants,
  disabled = false,
  label = "Add to Cart",
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleClick() {
    // Products with variants require the user to pick one on the PDP first.
    if (hasVariants) {
      window.location.href = `/products/${productSlug}`;
      return;
    }

    if (disabled || status === "loading") return;

    setStatus("loading");

    try {
      await cartApi.addItem({
        product_id: productId,
        quantity: 1,
      });
      setStatus("success");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2500);
    }
  }

  return (
    <Button
      type="button"
      size="default"
      className="h-9 w-9 px-0 sm:w-full sm:px-2.5 sm:text-sm"
      disabled={disabled || status === "loading"}
      onClick={handleClick}
      aria-label={disabled ? label : `${label} for product`}
    >
      <IconShoppingBagPlus className="sm:hidden" />
      <span className="hidden sm:inline">
        {status === "loading"
          ? "Adding..."
          : status === "success"
            ? "Added"
            : status === "error"
              ? "Try again"
              : hasVariants
                ? "Choose options"
                : label}
      </span>
    </Button>
  );
}
