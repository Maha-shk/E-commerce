"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductImage } from "@/components/customer/ProductImage";
import { productFallback } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

/** Image URLs in display order — the shape the storefront API actually sends. */
type GalleryImages = string[];

/**
 * Product image viewer: one large frame plus a thumbnail rail.
 *
 * Rewritten to use `next/image` (via ProductImage) — it previously used raw
 * `<img>` tags, so full-size originals were shipped for every thumbnail.
 */
export function ProductGallery({
  images = [],
  fallbackSeed,
}: {
  images: GalleryImages;
  /**
   * The product id, so a product with no photos shows the same bundled
   * artwork here as on the card the shopper clicked to get here. Without it
   * the two disagree and the page looks like it loaded the wrong product.
   */
  fallbackSeed?: string;
}) {
  const [index, setIndex] = useState(0);
  const fallback = fallbackSeed ? productFallback(fallbackSeed) : undefined;

  if (images.length === 0) {
    return (
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        <ProductImage
          src={null}
          fallbackSrc={fallback}
          sizes="(max-width: 1024px) 100vw, 560px"
          priority
        />
      </div>
    );
  }

  const current = images[Math.min(index, images.length - 1)];
  const step = (delta: number) =>
    setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="flex flex-col gap-3">
      {/* Main frame */}
      <div className="group relative aspect-square w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
        <ProductImage
          key={current}
          src={current}
          fallbackSrc={fallback}
          sizes="(max-width: 1024px) 100vw, 560px"
          priority
        />

        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-card opacity-0 backdrop-blur-sm transition hover:bg-card focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring group-hover:opacity-100"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-foreground shadow-card opacity-0 backdrop-blur-sm transition hover:bg-card focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring group-hover:opacity-100"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>

            <span className="absolute right-3 bottom-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium tabular-nums backdrop-blur-sm">
              {Math.min(index, images.length - 1) + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      {/* Thumbnails — a horizontal rail on every breakpoint, so the layout
          doesn't reshuffle between mobile and desktop. */}
      {images.length > 1 ? (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto" role="tablist">
          {images.map((image, i) => (
            <button
              key={image}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`View image ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted transition",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                i === index
                  ? "ring-2 ring-primary"
                  : "opacity-70 ring-1 ring-foreground/10 hover:opacity-100",
              )}
            >
              <ProductImage src={image} fallbackSrc={fallback} sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
