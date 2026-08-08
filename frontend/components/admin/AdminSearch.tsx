"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Package, Search, ShoppingBag, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useOrders, useProducts } from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatEuro } from "@/lib/admin/format";
import { orderStatusLabel } from "@/lib/api/models";
import { cn } from "@/lib/utils";

const MAX_PER_GROUP = 4;

/**
 * Global admin search.
 *
 * The topbar previously rendered a bare `<Input>` with no state, no handler and
 * no results — typing in it did nothing at all. This queries products and
 * orders as you type and links straight to the matching record.
 */
export function AdminSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useDebounce(query, 250);
  const enabled = search.trim().length >= 2;

  const { data: productData, isFetching: productsFetching } = useProducts(
    { search, limit: MAX_PER_GROUP },
    { enabled },
  );
  const { data: orderData, isFetching: ordersFetching } = useOrders(
    { search, limit: MAX_PER_GROUP },
    { enabled },
  );

  const products = enabled ? (productData?.data ?? []) : [];
  const orders = enabled ? (orderData?.data ?? []) : [];
  const isFetching = enabled && (productsFetching || ordersFetching);
  const hasResults = products.length > 0 || orders.length > 0;

  // Close when clicking away or pressing Escape.
  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const close = () => {
    setIsOpen(false);
    setQuery("");
  };

  return (
    // Sized to sit in the topbar action cluster rather than stretch across it.
    <div ref={containerRef} className="relative w-full min-w-0 sm:w-64 lg:w-80">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!enabled) return;
          // Enter falls back to the full product list, filtered.
          router.push(`/admin/products?search=${encodeURIComponent(search.trim())}`);
          close();
        }}
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
          aria-hidden
        />
        <Input
          type="text"
          inputMode="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-label="Search orders and products"
          placeholder="Search orders, products..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          // h-10 + rounded-lg matches the icon buttons beside it — this was
          // h-11 and rounded-full, so a 44px pill sat next to 40px squares.
          className={cn("h-10 w-full bg-card pl-9", query && "pr-9")}
        />
        {query ? (
          <button
            type="button"
            onClick={close}
            aria-label="Clear search"
            className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-subtle transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </form>

      {isOpen && enabled ? (
        <div className="absolute top-full right-0 z-50 mt-2 w-full min-w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          {isFetching && !hasResults ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-subtle">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Searching…
            </div>
          ) : !hasResults ? (
            <p className="px-4 py-6 text-sm text-subtle">
              Nothing matches “{search.trim()}”.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto py-1.5">
              {products.length > 0 ? (
                <div>
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wider text-subtle uppercase">
                    Products
                  </p>
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/admin/products/${product.id}/edit`}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <Package className="size-4 shrink-0 text-subtle" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{product.name}</span>
                      <span className="shrink-0 text-xs text-subtle tabular-nums">
                        {formatEuro(product.price)}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}

              {orders.length > 0 ? (
                <div>
                  <p className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wider text-subtle uppercase">
                    Orders
                  </p>
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href="/admin/orders"
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-muted"
                    >
                      <ShoppingBag className="size-4 shrink-0 text-subtle" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">
                        {order.orderNumber}
                        {order.customer ? (
                          <span className="text-subtle"> · {order.customer.fullName}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-xs text-subtle">
                        {orderStatusLabel[order.status]}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
