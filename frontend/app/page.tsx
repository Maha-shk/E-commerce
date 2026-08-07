"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  useHomepageCategories,
  useBestSellers,
  useNewArrivals,
  useSaleProducts,
  useHeroBanners,
} from "@/lib/hooks/use-homepage";
import { useCart } from "@/lib/hooks/use-cart";
import type { Product } from "@/lib/api/services/public";
import { ProductCard } from "@/components/customer/ProductCard";
import { ProductImage } from "@/components/customer/ProductImage";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { Container } from "@/components/customer/Container";
import { SectionHeading } from "@/components/customer/SectionHeading";
import { CarouselItem, ProductCarousel } from "@/components/customer/ProductCarousel";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Consistent vertical rhythm for every homepage band. */
const SECTION = "py-14 md:py-18";

function SectionSpinner() {
  return (
    <div className="col-span-full flex justify-center py-12">
      <Loader2 className="size-7 animate-spin text-muted-foreground" aria-hidden />
    </div>
  );
}

/** Stock pill overlaid on the New Arrivals tiles. */
function StockPill({ product }: { product: Product }) {
  if (!product.inStock) {
    return <span className="text-xs font-medium text-red-300">Out of stock</span>;
  }
  if (product.lowStock) {
    return (
      <span className="text-xs font-medium text-orange-300">
        Only {product.stock} left
      </span>
    );
  }
  return <span className="text-xs font-medium text-green-300">In stock</span>;
}

export default function HomePage() {
  // Tracked per product: a single shared flag disabled every Add to Cart
  // button on the page while any one of them was in flight.
  const [addingId, setAddingId] = useState<string | null>(null);

  const { data: categories, isPending: categoriesPending } = useHomepageCategories(6);
  const { data: bestSellers, isPending: bestSellersPending } = useBestSellers(10);
  const { data: newArrivals, isPending: newArrivalsPending } = useNewArrivals(3);
  const { data: saleProducts, isPending: saleProductsPending } = useSaleProducts(10);
  // Highest-priority active HERO banner, if the admin has published one.
  const { data: heroBanners } = useHeroBanners();
  const heroBanner = heroBanners?.[0];

  const { addItem } = useCart();

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setAddingId(productId);
    try {
      await addItem(productId, 1);
    } catch {
      // useCart already surfaced the reason as a toast.
    } finally {
      setAddingId(null);
    }
  };

  const [featured, ...secondary] = newArrivals ?? [];

  return (
    // `bleed` because the homepage lays out its own full-width bands; each
    // band uses <Container> internally so they still line up with the header.
    <CustomerPageShell bleed>
      {/* Hero — driven by the active HERO banner, with the built-in artwork as
          the fallback so the page never renders an empty slot. */}
      <section className="pt-8 pb-4 md:pt-10 md:pb-6">
        <Container>
          <div className="relative h-96 overflow-hidden rounded-3xl md:h-120">
            <Image
              src={heroBanner?.imageUrl || "/images/homepage/hero-image.png"}
              alt=""
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
              // Remote banner URLs can't be optimised without a configured
              // loader domain; the bundled fallback still goes through it.
              unoptimized={Boolean(heroBanner?.imageUrl)}
            />
            {/* Brand-navy scrim (was a hardcoded green that clashed with the
                rest of the palette), heavier on the left so the copy stays
                legible over any artwork. */}
            <div className="absolute inset-0 bg-linear-to-r from-primary/90 via-primary/60 to-transparent" />

            <div className="absolute inset-0 flex items-center">
              <div className="max-w-xl px-6 sm:px-10 md:px-14">
                <h1 className="text-3xl leading-tight font-semibold tracking-tight text-white text-balance md:text-4xl lg:text-5xl">
                  {heroBanner?.title || "Experience the Future of Audio Engineering"}
                </h1>
                {heroBanner?.description ? (
                  <p className="mt-3 max-w-lg text-sm text-white/85 text-pretty md:text-base">
                    {heroBanner.description}
                  </p>
                ) : null}
                <Button
                  asChild
                  size="xl"
                  className="mt-6 rounded-full bg-orange-500 text-white hover:bg-orange-600"
                >
                  <Link href={heroBanner?.linkUrl || "/products"}>
                    {heroBanner?.linkText || "Shop Now"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Categories */}
      <section className={SECTION}>
        <Container>
          <SectionHeading title="Explore Categories" href="/categories" />

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categoriesPending ? (
              <SectionSpinner />
            ) : categories && categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-muted transition-shadow duration-150 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <ProductImage
                    src={category.thumbnailName}
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 200px"
                    className="transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent" />
                  <h3 className="absolute inset-x-0 bottom-0 truncate p-3 text-center text-sm font-semibold text-white">
                    {category.name}
                  </h3>
                </Link>
              ))
            ) : (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                No categories available.
              </p>
            )}
          </div>
        </Container>
      </section>

      {/* Best sellers */}
      <section className={SECTION}>
        <Container>
          <SectionHeading title="Best Sellers" href="/best-sellers" />

          {bestSellersPending ? (
            <SectionSpinner />
          ) : bestSellers && bestSellers.length > 0 ? (
            <ProductCarousel label="Best sellers" itemCount={bestSellers.length}>
              {bestSellers.map((product) => (
                <CarouselItem key={product.id}>
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </ProductCarousel>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products available.
            </p>
          )}
        </Container>
      </section>

      {/* New arrivals */}
      <section className={SECTION}>
        <Container>
          <SectionHeading title="New Arrivals" href="/new-arrivals" />

          {newArrivalsPending ? (
            <SectionSpinner />
          ) : featured ? (
            // Two grid rows, with the featured tile spanning both. The grid
            // resolves the heights, so the featured tile and the stacked pair
            // always end on the same baseline — previously the featured card
            // had a hardcoded 512px min-height while the stack next to it
            // measured 536px (2 × h-64 + a 24px gap), so they never lined up.
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:grid-rows-2">
              <NewArrivalTile
                product={featured}
                featured
                isAdding={addingId === featured.id}
                onAddToCart={handleAddToCart}
                className="lg:col-span-2 lg:row-span-2"
              />
              {secondary.slice(0, 2).map((product) => (
                <NewArrivalTile
                  key={product.id}
                  product={product}
                  isAdding={addingId === product.id}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No new arrivals right now.
            </p>
          )}
        </Container>
      </section>

      {/* Sales */}
      <section className={SECTION}>
        <Container>
          <SectionHeading title="Sales" href="/sales" />

          {saleProductsPending ? (
            <SectionSpinner />
          ) : saleProducts && saleProducts.length > 0 ? (
            <ProductCarousel label="Sale products" itemCount={saleProducts.length}>
              {saleProducts.map((product) => (
                <CarouselItem key={product.id}>
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </ProductCarousel>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No sale products available.
            </p>
          )}
        </Container>
      </section>

    </CustomerPageShell>
  );
}

/**
 * One New Arrivals tile.
 *
 * The whole tile used to be wrapped in a <Link> with the Add to Cart <button>
 * nested inside it — invalid HTML (interactive content inside an anchor) and a
 * click-target trap. The link now covers only the image via a stretched
 * overlay, leaving the button as a real sibling.
 */
function NewArrivalTile({
  product,
  featured = false,
  isAdding,
  onAddToCart,
  className,
}: {
  product: Product;
  featured?: boolean;
  isAdding: boolean;
  onAddToCart: (e: React.MouseEvent, productId: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative isolate overflow-hidden rounded-2xl bg-muted",
        featured ? "min-h-80 lg:min-h-0" : "min-h-56",
        className,
      )}
    >
      <ProductImage
        src={product.images?.[0]?.url}
        sizes={featured ? "(max-width: 1024px) 100vw, 840px" : "(max-width: 1024px) 100vw, 420px"}
        className="transition-transform duration-300 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent" />

      {/* Stretched link: covers the tile for navigation, but sits below the
          button in the stacking order so the button stays clickable. */}
      <Link
        href={`/products/${product.id}`}
        className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
      >
        <span className="sr-only">View {product.name}</span>
      </Link>

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-20",
          featured ? "p-6 sm:p-8" : "p-4",
        )}
      >
        <h3
          className={cn(
            "font-semibold tracking-tight text-white",
            featured ? "text-xl sm:text-2xl" : "line-clamp-1 text-sm",
          )}
        >
          {product.name}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className={cn(
              "font-semibold tabular-nums text-orange-400",
              featured ? "text-xl" : "text-sm",
            )}
          >
            {formatMoney(product.salePrice)}
          </span>
          {product.discountPercent > 0 ? (
            <span
              className={cn(
                "text-white/70 line-through tabular-nums",
                featured ? "text-sm" : "text-xs",
              )}
            >
              {formatMoney(product.price)}
            </span>
          ) : null}
          <StockPill product={product} />
        </div>

        <Button
          // Re-enable clicks on the button itself; the wrapper is
          // pointer-events-none so the stretched link stays reachable.
          className="pointer-events-auto mt-4"
          size={featured ? "lg" : "sm"}
          disabled={!product.inStock || isAdding}
          onClick={(e) => onAddToCart(e, product.id)}
        >
          {isAdding ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {product.inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </div>
    </div>
  );
}
