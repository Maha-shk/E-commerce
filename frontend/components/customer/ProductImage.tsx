"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product thumbnail that degrades gracefully.
 *
 * `next/image` renders its `alt` text as plain, unstyled, unclipped text when
 * the source 404s or the optimiser rejects it — which is what put a wall of
 * overflowing "SoundTower Bluetooth Speaker" across the checkout summary. Here
 * a failed load swaps to a proper placeholder instead, and `alt` is empty
 * because every use site already shows the product name right next to it.
 *
 * Fills its parent, so the parent must be `relative` with a size.
 */
export function ProductImage({
  src,
  fallbackSrc,
  sizes,
  className,
  priority,
}: {
  src?: string | null;
  /**
   * Bundled artwork to show when `src` is missing *or* fails to load.
   *
   * Both cases matter on the storefront: most records have no image at all,
   * and several of the ones that do point at a page URL rather than a file, so
   * they 404 through the optimiser. Omit it to keep the empty placeholder —
   * which is what the admin console wants.
   */
  fallbackSrc?: string;
  /** Always pass this — without it Next ships a full-viewport-width source. */
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  const resolved = !src || failed ? fallbackSrc : src;

  if (!resolved) {
    return (
      <div
        className={cn(
          "flex size-full items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
      >
        <ImageOff className="size-1/3 max-h-8 min-h-4" aria-hidden />
      </div>
    );
  }

  return (
    <Image
      // Keyed on the resolved source so swapping to the fallback remounts;
      // without it React reuses the element and the error state sticks.
      key={resolved}
      src={resolved}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      // A bundled file goes through the optimiser; an arbitrary remote host
      // can't be, without allow-listing every CDN the admin might paste in.
      unoptimized={!resolved.startsWith("/")}
      className={cn("object-cover", className)}
    />
  );
}
