"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Product thumbnail for the admin tables.
 *
 * Both the dashboard and the products table rendered a generic `Package` icon
 * for every row — the products page even had a column literally headed "Image".
 * `Product.images` has been available all along.
 *
 * Falls back to the icon when there's no image or the URL fails, so a broken
 * asset can never spill raw alt text across the row.
 */
export function ProductThumb({
  src,
  size = "md",
  className,
}: {
  src?: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const px = size === "sm" ? 36 : 44;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground ring-1 ring-foreground/5",
        size === "sm" ? "size-9" : "size-11",
        className,
      )}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={`${px}px`}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Package className={size === "sm" ? "size-4" : "size-5"} aria-hidden />
      )}
    </span>
  );
}
