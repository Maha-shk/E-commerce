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
  sizes,
  className,
  priority,
}: {
  src?: string | null;
  /** Always pass this — without it Next ships a full-viewport-width source. */
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
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
      src={src}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
