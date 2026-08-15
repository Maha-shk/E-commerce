/**
 * Bundled artwork used when a record has no image of its own.
 *
 * Most of the catalogue has never had a photo uploaded — 93 of 100 products at
 * last count — so the storefront was rendering a grid of empty grey tiles. This
 * spreads the artwork that ships in `public/images/homepage` across them so the
 * page reads as a shop rather than a broken one.
 *
 * Two rules make it behave:
 *
 * - **Deterministic.** The same product gets the same picture every time, on
 *   every screen. Random assignment would reshuffle on each render, so a
 *   product would change appearance between the carousel and its own page.
 * - **Storefront only.** The admin console deliberately keeps its empty
 *   placeholders: there, "no image" is a fact the person needs to see and act
 *   on, and dressing it up would hide work that still needs doing.
 *
 * A real uploaded image always wins — this only fills the gap.
 */

export const PRODUCT_FALLBACKS = [
  "/images/homepage/product-1.jpg",
  "/images/homepage/product-2.jpg",
  "/images/homepage/product-3.jpg",
  "/images/homepage/product-4.jpg",
  "/images/homepage/product-5.jpg",
  "/images/homepage/product-6.jpg",
  "/images/homepage/product-7.jpg",
  "/images/homepage/product-8.jpg",
] as const;

export const CATEGORY_FALLBACKS = [
  "/images/homepage/category-1.jpg",
  "/images/homepage/category-2.jpg",
  "/images/homepage/category-3.jpg",
  "/images/homepage/category-4.jpg",
  "/images/homepage/banner-1.jpg",
  "/images/homepage/banner-2.jpg",
] as const;

/** The bundled hero artwork, for when a banner has no usable image. */
export const HERO_FALLBACK = "/images/homepage/hero-image.png";

/**
 * Stable 32-bit hash of a string, so an id maps to the same slot every time.
 * Not cryptographic — it only has to spread ids evenly across a short list.
 */
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (Math.imul(h, 31) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Picks from a pool by seed.
 *
 * Pass a **number** when the caller is mapping a list — the index guarantees
 * neighbouring tiles differ, which is what stops a row of six categories
 * showing the same photo twice. Pass the record **id** everywhere else, so the
 * choice still holds when the same item appears somewhere without an index.
 */
function pick(pool: readonly string[], seed: string | number): string {
  const index = typeof seed === "number" ? seed : hash(seed);
  return pool[index % pool.length];
}

export function productFallback(seed: string | number): string {
  return pick(PRODUCT_FALLBACKS, seed);
}

export function categoryFallback(seed: string | number): string {
  return pick(CATEGORY_FALLBACKS, seed);
}
