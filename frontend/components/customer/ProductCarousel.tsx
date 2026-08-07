"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Horizontally scrolling product rail.
 *
 * Replaces the previous hand-rolled version, which had two problems:
 *
 *  1. The scroll container held a *second* `overflow-x-auto` flex div, so
 *     `scrollBy()` was called on an element that never actually overflowed —
 *     the arrows moved nothing.
 *  2. Arrow enabled/disabled state came from a counter incremented on click,
 *     so it desynced the moment anyone scrolled by trackpad, wheel or touch.
 *
 * Here there is exactly one scroller, and the arrow state is read back from
 * its real `scrollLeft`, so it stays correct no matter how the user scrolls.
 */
export function ProductCarousel({
  children,
  itemCount,
  label,
}: {
  children: ReactNode;
  /** Re-measures when the number of items changes. */
  itemCount: number;
  /** Accessible name, e.g. "Best sellers". */
  label: string;
}) {
  // Callback-ref state rather than useRef: we need a render when the node
  // attaches so the effect below can bind to it.
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const measure = useCallback((node: HTMLDivElement) => {
    const { scrollLeft, scrollWidth, clientWidth } = node;
    // 1px of slack absorbs sub-pixel rounding at the extremes.
    setAtStart(scrollLeft <= 1);
    setAtEnd(scrollLeft >= scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    if (!scroller) return;

    const update = () => measure(scroller);
    // ResizeObserver fires once on observe(), which gives us the initial
    // measurement without a synchronous setState in the effect body.
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    scroller.addEventListener("scroll", update, { passive: true });

    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
    };
  }, [scroller, measure, itemCount]);

  // Scroll by ~a screenful of the rail rather than a hardcoded card width, so
  // it behaves correctly at every breakpoint.
  const scrollBy = (direction: -1 | 1) =>
    scroller?.scrollBy({
      left: direction * scroller.clientWidth * 0.9,
      behavior: "smooth",
    });

  const hasOverflow = !(atStart && atEnd);

  const arrowClass =
    "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-card transition duration-150 hover:bg-muted disabled:pointer-events-none disabled:opacity-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <div className="relative">
      {hasOverflow ? (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={atStart}
          aria-label={`Scroll ${label} left`}
          className={cn(arrowClass, "-left-2 sm:-left-5")}
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
      ) : null}

      <div
        ref={setScroller}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cn(
          "scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth py-1",
          // The rail is focusable for keyboard scrolling, so it needs a ring.
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      >
        {children}
      </div>

      {hasOverflow ? (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={atEnd}
          aria-label={`Scroll ${label} right`}
          className={cn(arrowClass, "-right-2 sm:-right-5")}
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/** One snap-aligned slide in the rail. */
export function CarouselItem({ children }: { children: ReactNode }) {
  return <div className="w-64 shrink-0 snap-start sm:w-68">{children}</div>;
}
