"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/api/catalog";

interface Props {
  images: ProductImage[];
  productName: string;
}

export default function ProductImageGallery({ images, productName }: Props) {
  const [activeIndex, setActiveIndex] = React.useState(
    () => Math.max(images.findIndex((img) => img.is_primary), 0),
  );

  const activeImage = images[activeIndex] ?? null;
  const mainSrc = activeImage?.gallery_url ?? activeImage?.url ?? null;

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
        {mainSrc ? (
          <img
            key={mainSrc}
            src={mainSrc}
            alt={productName}
            className="h-full w-full object-cover transition-opacity duration-200"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Thumbnails — scrollable on mobile */}
      {images.length > 1 && (
        <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none]">
          <div className="flex gap-2 min-w-max">
            {images.map((img, i) => {
              const thumbSrc = img.thumb_url ?? img.url;
              const isActive = i === activeIndex;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`View image ${i + 1}`}
                  aria-pressed={isActive}
                  className={cn(
                    "aspect-square w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-[4.5rem]",
                    isActive
                      ? "border-foreground"
                      : "border-transparent opacity-60 hover:opacity-90",
                  )}
                >
                  <img
                    src={thumbSrc}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
