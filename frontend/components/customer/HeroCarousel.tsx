"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Banner } from "@/lib/api/services/public";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;

/** Shown when the admin hasn't published any HERO banner. */
const FALLBACK: Banner = {
  id: "fallback",
  type: "HERO",
  title: "Experience the Future of Audio Engineering",
  imageUrl: "/images/homepage/hero-image.png",
  linkUrl: "/products",
  linkText: "Shop Now",
};

/**
 * Hero banner carousel.
 *
 * The homepage previously rendered `heroBanners?.[0]` and nothing else — so no
 * matter how many active HERO banners the admin published, only the
 * highest-priority one was ever visible and the "carousel" never moved. This
 * cycles through all of them.
 *
 * Autoplay pauses on hover, on focus, and whenever the tab is hidden, and is
 * disabled entirely for users who prefer reduced motion.
 */
export function HeroCarousel({ banners }: { banners?: Banner[] }) {
  const slides = banners && banners.length > 0 ? banners : [FALLBACK];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = slides.length;
  const go = useCallback((next: number) => setIndex((next + count) % count), [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      AUTOPLAY_MS,
    );
    return () => window.clearInterval(timer);
  }, [count, paused]);

  // Don't advance in a background tab — otherwise the shopper returns to a
  // slide that jumped several positions while they weren't looking.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const active = slides[index];

  return (
    <div
      className="group/hero relative h-96 overflow-hidden rounded-3xl bg-muted md:h-120"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured"
    >
      {slides.map((slide, i) => {
        const desktopSrc = slide.imageUrl || FALLBACK.imageUrl;
        // The admin can upload a separate mobile crop, and the API returns it —
        // but the storefront was only ever rendering `imageUrl`, so a portrait
        // banner uploaded for phones was silently unused.
        const mobileSrc = slide.mobileImageUrl || desktopSrc;
        const hasMobileCrop = Boolean(
          slide.mobileImageUrl && slide.mobileImageUrl !== desktopSrc,
        );

        return (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out",
              i === index ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            aria-hidden={i !== index}
          >
            {hasMobileCrop ? (
              <Image
                src={mobileSrc}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover md:hidden"
                unoptimized={!mobileSrc.startsWith("/")}
              />
            ) : null}

            <Image
              src={desktopSrc}
              alt=""
              fill
              priority={i === 0}
              sizes="(max-width: 1280px) 100vw, 1280px"
              className={cn("object-cover", hasMobileCrop && "hidden md:block")}
              // Remote banner URLs can't be optimised without a configured
              // loader domain; the bundled fallback still goes through it.
              unoptimized={!desktopSrc.startsWith("/")}
            />
          </div>
        );
      })}

      {/* Brand-navy scrim, heavier on the left so copy stays legible over any
          artwork the admin uploads. */}
      <div className="absolute inset-0 bg-linear-to-r from-primary/90 via-primary/60 to-transparent" />

      <div className="absolute inset-0 flex items-center">
        <div className="max-w-xl px-6 sm:px-10 md:px-14">
          <h1
            key={`${active.id}-title`}
            className="text-3xl leading-tight font-semibold tracking-tight text-white text-balance md:text-4xl lg:text-5xl"
          >
            {active.title || FALLBACK.title}
          </h1>

          {active.description ? (
            <p className="mt-3 max-w-lg text-sm text-white/85 text-pretty md:text-base">
              {active.description}
            </p>
          ) : null}

          <Button
            asChild
            size="xl"
            className="mt-6 rounded-full bg-orange-500 text-white hover:bg-orange-600"
          >
            <Link href={active.linkUrl || "/products"}>
              {active.linkText || "Shop Now"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Controls only exist when there's more than one slide. */}
      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous banner"
            className="absolute top-1/2 left-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/40 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white group-hover/hero:opacity-100 md:left-5"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next banner"
            className="absolute top-1/2 right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/40 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white group-hover/hero:opacity-100 md:right-5"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>

          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to banner ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
