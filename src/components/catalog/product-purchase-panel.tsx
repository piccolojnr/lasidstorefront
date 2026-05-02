"use client";

import * as React from "react";
import { cartApi } from "@/api/cart";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProductVariant, ProductStock } from "@/api/catalog";

interface Props {
  productId: number;
  basePrice: number;
  compareAtPrice: number | null;
  stock: ProductStock | null;
  trackInventory: boolean;
  allowBackorders: boolean;
  variants: ProductVariant[];
}

function deriveStockState(
  stock: ProductStock | null,
  trackInventory: boolean,
  allowBackorders: boolean,
) {
  if (!trackInventory) {
    return { label: null, color: null, canAdd: true, isPreorder: false };
  }
  if (!stock) {
    return { label: null, color: null, canAdd: true, isPreorder: false };
  }
  if (stock.status === "out_of_stock") {
    if (stock.is_backorderable || allowBackorders) {
      return {
        label: "Pre-order available",
        color: "text-warning",
        canAdd: true,
        isPreorder: true,
      };
    }
    return {
      label: "Out of stock",
      color: "text-destructive",
      canAdd: false,
      isPreorder: false,
    };
  }
  if (stock.status === "low_stock") {
    return {
      label: "Only a few left",
      color: "text-warning",
      canAdd: true,
      isPreorder: false,
    };
  }
  // in_stock
  return {
    label: "In stock",
    color: "text-success",
    canAdd: true,
    isPreorder: false,
  };
}

export default function ProductPurchasePanel({
  productId,
  basePrice,
  compareAtPrice,
  stock,
  trackInventory,
  allowBackorders,
  variants,
}: Props) {
  const allVariants = variants;
  const hasVariants = allVariants.length > 0;

  const [selectedVariantId, setSelectedVariantId] = React.useState<
    number | null
  >(hasVariants ? (allVariants.find((v) => v.is_active)?.id ?? null) : null);

  const [quantity, setQuantity] = React.useState(1);
  const [addStatus, setAddStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState("");

  const selectedVariant = allVariants.find((v) => v.id === selectedVariantId);

  // Reactive price — use selected variant price if it differs
  const displayPrice = selectedVariant?.price ?? basePrice;
  const displayCompare =
    selectedVariant?.compare_at_price ?? compareAtPrice ?? null;
  const hasDiscount =
    displayCompare !== null && displayCompare > displayPrice;
  const discountPct = hasDiscount
    ? Math.round((1 - displayPrice / displayCompare!) * 100)
    : 0;

  const { label: stockLabel, color: stockColor, canAdd, isPreorder } =
    deriveStockState(stock, trackInventory, allowBackorders);

  const buttonLabel = !canAdd
    ? "Out of Stock"
    : isPreorder
      ? "Pre-order"
      : addStatus === "success"
        ? "Added to cart!"
        : "Add to Cart";

  async function handleAdd() {
    if (!canAdd || addStatus === "loading") return;
    setAddStatus("loading");
    setErrorMsg("");
    try {
      await cartApi.addItem({
        product_id: productId,
        ...(selectedVariantId ? { product_variant_id: selectedVariantId } : {}),
        quantity,
      });
      setAddStatus("success");
      setTimeout(() => setAddStatus("idle"), 2500);
    } catch (err) {
      setAddStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Could not add to cart. Try again.",
      );
      setTimeout(() => setAddStatus("idle"), 3000);
    }
  }

  return (
    <>
      {/* ── Price ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-2xl font-bold text-foreground sm:text-3xl">
          {formatMoney(displayPrice)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-base text-muted-foreground line-through">
              {formatMoney(displayCompare!)}
            </span>
            <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-white">
              -{discountPct}%
            </span>
          </>
        )}
      </div>

      {/* ── Stock status ───────────────────────────────────────────── */}
      {stockLabel && (
        <p className={cn("text-sm font-medium", stockColor)}>{stockLabel}</p>
      )}

      <hr className="border-border" />

      {/* ── Variant selector ───────────────────────────────────────── */}
      {hasVariants && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">Option</p>
          <div className="flex flex-wrap gap-2">
            {allVariants.map((v) => {
              const isSelected = selectedVariantId === v.id;
              const isDisabled = !v.is_active;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setSelectedVariantId(v.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isDisabled
                      ? "cursor-not-allowed border-border opacity-35"
                      : isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-foreground hover:border-foreground/40",
                  )}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quantity + Add to Cart ──────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Quantity stepper */}
        <div className="flex items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </button>
          <span className="w-10 text-center text-sm font-semibold tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            disabled={!canAdd}
            aria-label="Increase quantity"
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </button>
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd || addStatus === "loading"}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            !canAdd
              ? "cursor-not-allowed border border-border bg-muted text-muted-foreground"
              : addStatus === "success"
                ? "bg-success text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {addStatus === "loading" && (
            <svg
              className="h-4 w-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          )}
          {buttonLabel}
        </button>
      </div>

      {addStatus === "error" && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      {/* ── Mobile sticky bar ──────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-foreground leading-none">
            {formatMoney(displayPrice)}
          </p>
          {hasDiscount && (
            <p className="mt-0.5 text-xs text-muted-foreground line-through">
              {formatMoney(displayCompare!)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd || addStatus === "loading"}
          className={cn(
            "shrink-0 rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200",
            !canAdd
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : addStatus === "success"
                ? "bg-success text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {addStatus === "loading"
            ? "Adding..."
            : addStatus === "success"
              ? "Added!"
              : isPreorder
                ? "Pre-order"
                : !canAdd
                  ? "Out of Stock"
                  : "Add to Cart"}
        </button>
      </div>
    </>
  );
}
