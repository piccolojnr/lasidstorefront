"use client";

import * as React from "react";
import { useStore } from "@nanostores/react";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

import { wishlistStore, toggleWishlist } from "@/stores/wishlist-store";
import { catalogApi, type ProductSummary } from "@/api/catalog";
import CardAddToCartButton from "@/components/cart/card-add-to-cart-button";
import { formatMoney } from "@/lib/money";

function WishlistItem({ product }: { product: ProductSummary }) {
  const imageSrc = product.primary_image_card_url ?? product.primary_image_url;
  const hasVariants = product.has_variants === true;
  const stock = product.stock ?? null;
  const isOutOfStock = stock?.status === "out_of_stock" && !stock.is_backorderable;
  const isBackorder = stock?.status === "out_of_stock" && stock.is_backorderable;
  const buttonLabel = isOutOfStock
    ? "Out of Stock"
    : isBackorder
      ? "Pre-order"
      : "Add to Cart";

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    toggleWishlist(product.id);
  }

  const hasCompareAtPrice =
    product.compare_at_price !== null &&
    product.compare_at_price !== undefined &&
    product.compare_at_price > product.base_price;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Remove button */}
      <button
        type="button"
        onClick={handleRemove}
        className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full border border-border bg-background/95 text-muted-foreground shadow-sm transition-colors hover:border-destructive/30 hover:text-destructive"
        aria-label="Remove from wishlist"
      >
        <IconHeartFilled className="size-4 text-destructive" aria-hidden="true" />
      </button>

      {/* Image */}
      <a href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-muted" tabIndex={-1} aria-hidden="true">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-muted-foreground shadow">Out of stock</span>
          </div>
        )}
      </a>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <a
          href={`/products/${product.slug}`}
          className="line-clamp-2 text-[13px] font-medium leading-5 text-foreground transition-colors hover:text-foreground/80 sm:text-sm"
        >
          {product.name}
        </a>

        <div className="mt-2 flex items-center justify-between gap-2 sm:mt-3 sm:block">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
            <span className="text-sm font-bold text-foreground sm:text-base">
              {formatMoney(product.base_price)}
            </span>
            {hasCompareAtPrice && (
              <span className="text-xs text-muted-foreground line-through sm:text-sm">
                {formatMoney(product.compare_at_price!)}
              </span>
            )}
          </div>

          {/* Mobile: icon button — navigates to the PDP when variants must be picked */}
          <div className="shrink-0 sm:hidden">
            <CardAddToCartButton
              productId={product.id}
              productSlug={product.slug}
              hasVariants={hasVariants}
              disabled={isOutOfStock}
              label={buttonLabel}
            />
          </div>
        </div>

        {/* Desktop: full-width button — shows "Choose options" for variant products */}
        <div className="mt-3 hidden sm:block">
          <CardAddToCartButton
            productId={product.id}
            productSlug={product.slug}
            hasVariants={hasVariants}
            disabled={isOutOfStock}
            label={buttonLabel}
          />
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const ids = useStore(wishlistStore);
  const [products, setProducts] = React.useState<ProductSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch product details for all wishlisted IDs.
  // The catalog API doesn't have a bulk-by-id endpoint, so we use search
  // and filter client-side. If the wishlist is large this could be improved
  // with a dedicated endpoint later.
  React.useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch a wide page and filter to saved IDs.
    catalogApi
      .getProducts({ page: 1 })
      .then((result) => {
        const saved = result.data.filter((p) => ids.includes(p.id));
        setProducts(saved);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border">
            <div className="aspect-square animate-pulse bg-muted" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (ids.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <IconHeart className="h-14 w-14 text-muted-foreground/30" strokeWidth={1} />
        <div>
          <p className="text-base font-semibold text-foreground">No saved items yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the heart icon on any product to save it here.
          </p>
        </div>
        <a
          href="/products"
          className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse products
        </a>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-5 text-sm text-muted-foreground">
        {ids.length} {ids.length === 1 ? "item" : "items"} saved
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <WishlistItem key={product.id} product={product} />
        ))}
        {/* Saved IDs with no matching product in the current page — show placeholders */}
        {ids
          .filter((id) => !products.some((p) => p.id === id))
          .map((id) => (
            <div key={id} className="overflow-hidden rounded-xl border border-border bg-muted/40">
              <div className="aspect-square bg-muted" />
              <div className="p-3">
                <p className="text-xs text-muted-foreground">Product unavailable</p>
                <button
                  type="button"
                  onClick={() => toggleWishlist(id)}
                  className="mt-2 text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
