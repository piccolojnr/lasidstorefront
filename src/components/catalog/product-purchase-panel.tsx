"use client";

import * as React from "react";
import { useStore } from "@nanostores/react";
import { cartApi } from "@/api/cart";
import { cartStore } from "@/stores/cart-store";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type {
  ProductVariant,
  ProductOptionType,
  ProductStock,
  ProductVariantStock,
} from "@/api/catalog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  productId: number;
  basePrice: number;
  compareAtPrice: number | null;
  stock: ProductStock | null;
  trackInventory: boolean;
  allowBackorders: boolean;
  hasVariants: boolean;
  optionTypes: ProductOptionType[];
  variants: ProductVariant[];
}

interface StockState {
  label: string | null;
  color: string | null;
  canAdd: boolean;
  isPreorder: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveVariantStockState(
  stock: ProductVariantStock,
  allowBackorders: boolean,
): StockState {
  if (stock.status === "out_of_stock") {
    if (stock.is_backorderable || allowBackorders) {
      return { label: "Available on backorder", color: "text-warning", canAdd: true, isPreorder: true };
    }
    return { label: "Out of stock", color: "text-destructive", canAdd: false, isPreorder: false };
  }
  if (stock.status === "low_stock") {
    const qty = stock.quantity;
    return {
      label: qty !== null && qty > 0 ? `Only ${qty} left` : "Only a few left",
      color: "text-warning",
      canAdd: true,
      isPreorder: false,
    };
  }
  // in_stock
  return { label: "In stock", color: "text-success", canAdd: true, isPreorder: false };
}

function deriveSimpleStockState(
  stock: ProductStock | null,
  trackInventory: boolean,
  allowBackorders: boolean,
): StockState {
  if (!trackInventory || !stock) {
    return { label: null, color: null, canAdd: true, isPreorder: false };
  }
  if (stock.status === "out_of_stock") {
    if (stock.is_backorderable || allowBackorders) {
      return { label: "Pre-order available", color: "text-warning", canAdd: true, isPreorder: true };
    }
    return { label: "Out of stock", color: "text-destructive", canAdd: false, isPreorder: false };
  }
  if (stock.status === "low_stock") {
    return { label: "Only a few left", color: "text-warning", canAdd: true, isPreorder: false };
  }
  return { label: "In stock", color: "text-success", canAdd: true, isPreorder: false };
}

/** Find the variant whose option_value_ids exactly match the selected set. */
function findMatchingVariant(
  variants: ProductVariant[],
  selectedValues: Record<number, number>, // optionTypeId → optionValueId
): ProductVariant | null {
  const selectedIds = Object.values(selectedValues);
  if (selectedIds.length === 0) return null;

  return (
    variants.find(
      (v) =>
        v.option_value_ids.length === selectedIds.length &&
        selectedIds.every((id) => v.option_value_ids.includes(id)),
    ) ?? null
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductPurchasePanel({
  productId,
  basePrice,
  compareAtPrice,
  stock,
  trackInventory,
  allowBackorders,
  hasVariants,
  optionTypes,
  variants,
}: Props) {
  // selectedValues: optionTypeId → chosen optionValueId
  const [selectedValues, setSelectedValues] = React.useState<Record<number, number>>({});
  const [quantity, setQuantity] = React.useState(1);
  const [addStatus, setAddStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState("");
  const cart = useStore(cartStore);

  // ── Variant resolution ──────────────────────────────────────────────────────
  const allOptionTypesSelected =
    hasVariants && optionTypes.length > 0
      ? optionTypes.every((ot) => selectedValues[ot.id] !== undefined)
      : true;

  const selectedVariant = hasVariants
    ? findMatchingVariant(variants, selectedValues)
    : null;

  // Combination selected but no matching active variant
  const comboUnavailable = allOptionTypesSelected && hasVariants && selectedVariant === null;

  // ── Price display ───────────────────────────────────────────────────────────
  const displayPrice =
    selectedVariant?.price != null ? selectedVariant.price : basePrice;
  const displayCompare =
    selectedVariant !== null
      ? (selectedVariant.compare_at_price ?? null)
      : (compareAtPrice ?? null);
  const hasDiscount = displayCompare !== null && displayCompare > displayPrice;
  const discountPct = hasDiscount
    ? Math.round((1 - displayPrice / displayCompare!) * 100)
    : 0;

  // ── Stock state ─────────────────────────────────────────────────────────────
  // variant_dependent → suppress top-level stock until variant is picked
  const stockIsVariantDependent = stock?.status === "variant_dependent";

  const stockState: StockState = React.useMemo(() => {
    if (hasVariants) {
      if (!allOptionTypesSelected) {
        return { label: null, color: null, canAdd: false, isPreorder: false };
      }
      if (comboUnavailable) {
        return { label: "Not available in this combination", color: "text-destructive", canAdd: false, isPreorder: false };
      }
      if (selectedVariant) {
        return deriveVariantStockState(selectedVariant.stock, allowBackorders);
      }
      return { label: null, color: null, canAdd: false, isPreorder: false };
    }
    // Simple product
    return deriveSimpleStockState(stock, trackInventory, allowBackorders);
  }, [hasVariants, allOptionTypesSelected, comboUnavailable, selectedVariant, stock, trackInventory, allowBackorders]);

  const { label: stockLabel, color: stockColor, canAdd, isPreorder } = stockState;

  // ── Max quantity ────────────────────────────────────────────────────────────
  const stockQty = hasVariants
    ? (selectedVariant?.stock.quantity ?? null)
    : (stock?.quantity ?? null);

  // How many units of the current selection are already in the cart.
  const inCartQty = React.useMemo(() => {
    if (!cart) return 0;
    if (hasVariants) {
      if (!selectedVariant) return 0;
      return cart.items
        .filter((item) => item.product_variant_id === selectedVariant.id)
        .reduce((sum, item) => sum + item.quantity, 0);
    }
    return cart.items
      .filter(
        (item) => item.product_id === productId && item.product_variant_id === null,
      )
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cart, hasVariants, selectedVariant, productId]);

  // When stock is capped, what's still available to add = stock − in cart.
  const stockIsCapped =
    (hasVariants ? true : trackInventory) &&
    typeof stockQty === "number" &&
    stockQty > 0;

  const remainingQty = stockIsCapped ? Math.max(0, stockQty! - inCartQty) : null;
  const cartLimitReached = remainingQty === 0;

  const maxQuantity = remainingQty !== null ? remainingQty : 99;

  // Reset qty to 1 when variant changes
  React.useEffect(() => {
    setQuantity(1);
  }, [selectedVariant?.id]);

  // Clamp qty when the available-to-add amount shrinks (e.g. after adding)
  React.useEffect(() => {
    setQuantity((q) => Math.min(q, Math.max(1, maxQuantity)));
  }, [maxQuantity]);

  // ── Button label ────────────────────────────────────────────────────────────
  const buttonLabel = !allOptionTypesSelected
    ? "Select options"
    : comboUnavailable
      ? "Not available"
      : cartLimitReached
        ? "Limit reached"
        : !canAdd
          ? "Out of Stock"
          : isPreorder
            ? "Pre-order"
            : addStatus === "success"
              ? "Added to cart!"
              : "Add to Cart";

  // ── Add to cart ─────────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!canAdd || !allOptionTypesSelected || comboUnavailable || cartLimitReached || addStatus === "loading") return;
    setAddStatus("loading");
    setErrorMsg("");
    try {
      await cartApi.addItem({
        product_id: productId,
        ...(selectedVariant ? { product_variant_id: selectedVariant.id } : {}),
        quantity,
      });
      setAddStatus("success");
      setTimeout(() => setAddStatus("idle"), 2500);
    } catch (err) {
      setAddStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Could not add to cart. Try again.");
      setTimeout(() => setAddStatus("idle"), 3000);
    }
  }

  const addDisabled =
    !canAdd ||
    !allOptionTypesSelected ||
    comboUnavailable ||
    cartLimitReached ||
    addStatus === "loading";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Price */}
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

      {/* Top-level stock — only for simple products */}
      {!hasVariants && stockLabel && (
        <p className={cn("text-sm font-medium", stockColor)}>{stockLabel}</p>
      )}

      <hr className="border-border" />

      {/* Option type selectors */}
      {hasVariants && optionTypes.length > 0 && (
        <div className="flex flex-col gap-5">
          {optionTypes.map((optionType) => {
            const selectedValueId = selectedValues[optionType.id];

            // Determine which value IDs are still reachable given the other
            // currently-selected axes, so we can grey out dead combinations.
            const otherSelections = Object.entries(selectedValues)
              .filter(([typeId]) => Number(typeId) !== optionType.id)
              .map(([, valId]) => valId);

            const reachableValueIds = new Set(
              variants
                .filter((v) =>
                  otherSelections.every((id) => v.option_value_ids.includes(id)),
                )
                .flatMap((v) => v.option_value_ids),
            );

            return (
              <div key={optionType.id} className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {optionType.name}
                  {selectedValueId !== undefined && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      {optionType.values.find((v) => v.id === selectedValueId)?.value}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {optionType.values.map((val) => {
                    const isSelected = selectedValueId === val.id;
                    const isReachable = reachableValueIds.has(val.id);

                    return (
                      <button
                        key={val.id}
                        type="button"
                        disabled={!isReachable}
                        onClick={() => {
                          setSelectedValues((prev) => ({
                            ...prev,
                            [optionType.id]: val.id,
                          }));
                        }}
                        aria-pressed={isSelected}
                        className={cn(
                          "relative rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                          !isReachable
                            ? "cursor-not-allowed border-border text-muted-foreground/40 line-through"
                            : isSelected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-foreground hover:border-foreground/50",
                        )}
                      >
                        {val.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-variant stock (shown after variant is selected) */}
      {hasVariants && allOptionTypesSelected && stockLabel && (
        <p className={cn("text-sm font-medium", stockColor)}>{stockLabel}</p>
      )}

      {/* Variant SKU */}
      {selectedVariant && (
        <p className="text-xs text-muted-foreground">SKU: {selectedVariant.sku}</p>
      )}

      {/* Quantity + Add to Cart */}
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </button>
          <span className="w-10 text-center text-sm font-semibold tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(q + 1, maxQuantity))}
            disabled={addDisabled || quantity >= maxQuantity}
            aria-label="Increase quantity"
            className="flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={addDisabled}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            addDisabled && addStatus !== "loading"
              ? "cursor-not-allowed border border-border bg-muted text-muted-foreground"
              : addStatus === "success"
                ? "bg-success text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {addStatus === "loading" && <Spinner />}
          {buttonLabel}
        </button>
      </div>

      {addStatus === "error" && (
        <p className="text-sm text-destructive">{errorMsg}</p>
      )}

      {/* Cart-aware stock feedback */}
      {cartLimitReached ? (
        <p className="text-sm font-medium text-warning">
          All available stock is already in your cart.
        </p>
      ) : inCartQty > 0 ? (
        <p className="text-xs text-muted-foreground">
          {inCartQty} already in your cart
          {remainingQty !== null && ` — ${remainingQty} more available`}
        </p>
      ) : (
        maxQuantity < 99 &&
        quantity >= maxQuantity && (
          <p className="text-xs text-warning">Max available quantity: {maxQuantity}</p>
        )
      )}

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:hidden">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-foreground leading-none">{formatMoney(displayPrice)}</p>
          {hasDiscount && (
            <p className="mt-0.5 text-xs text-muted-foreground line-through">{formatMoney(displayCompare!)}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={addDisabled}
          className={cn(
            "shrink-0 rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200",
            addDisabled && addStatus !== "loading"
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
              : !allOptionTypesSelected
                ? "Select options"
                : comboUnavailable
                  ? "Not available"
                  : cartLimitReached
                    ? "Limit reached"
                    : !canAdd
                      ? "Out of Stock"
                      : isPreorder
                        ? "Pre-order"
                        : "Add to Cart"}
        </button>
      </div>
    </>
  );
}
