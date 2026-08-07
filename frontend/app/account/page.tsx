"use client";

import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideProps } from "lucide-react";
import {
  ArrowRight,
  Heart,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  ShoppingBag,
  User,
} from "lucide-react";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { SectionCard } from "@/components/account/SectionCard";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { ProductCard } from "@/components/customer/ProductCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession, useCurrentUser } from "@/lib/hooks/use-auth";
import { useWishlist } from "@/lib/hooks/use-wishlist";
import { useDefaultAddress, useMyOrders } from "@/lib/hooks/use-account";
import { formatMoney, formatShortDate } from "@/lib/format";

/** One "icon · label · value" line in the two summary cards. */
function SummaryRow({
  icon: Icon,
  label,
  children,
  align = "center",
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  children: ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div className={align === "start" ? "flex items-start gap-3" : "flex items-center gap-3"}>
      {/* 16px icon against a 16px label line-height: top-aligning the two in
          `items-start` lines them up exactly, no magic offset needed. */}
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="field-label">{label}</p>
        <div className="mt-0.5 text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

/** "View all →" link styled as a quiet button. */
function ViewAllLink({ href, children = "View all" }: { href: string; children?: ReactNode }) {
  return (
    <Button asChild size="sm" variant="ghost" className="-mr-1.5 text-muted-foreground">
      <Link href={href}>
        {children}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Button>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user } = useSession();
  // Refreshes the access token on page load.
  useCurrentUser();

  const { wishlistItems } = useWishlist();
  const { data: defaultAddress, isPending: addressPending } = useDefaultAddress();
  const { data: ordersPage, isPending: ordersPending } = useMyOrders({ page: 1, limit: 20 });

  // `AccountShell` already gates on an authenticated customer.
  if (!user) return null;

  const recentOrders = (ordersPage?.orders ?? []).slice(0, 4);

  const wishlistProducts = wishlistItems
    .slice()
    .reverse()
    .slice(0, 3)
    .map((item) => ({
      id: item.productId,
      name: item.name,
      images: item.image ? [{ url: item.image }] : [],
      discountPercent: item.discount,
      inStock: item.inStock,
      lowStock: item.lowStock,
      stock: item.stock,
      category: item.category,
      salePrice: item.salePrice,
      price: item.price,
    }));

  return (
    <AccountShell>
      <AccountPageHeader
        title={`Welcome back, ${user.fullName.split(" ")[0]}`}
        description="Manage your orders, saved products and account details."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <SectionCard
          title="Profile Summary"
          action={
            <Button asChild size="sm" variant="ghost" className="-mr-1.5">
              <Link href="/account/profile">
                <Pencil className="size-3.5" aria-hidden />
                Edit
              </Link>
            </Button>
          }
        >
          <div className="space-y-4">
            <SummaryRow icon={User} label="Name">
              <span className="block truncate">{user.fullName}</span>
            </SummaryRow>

            <SummaryRow icon={Mail} label="Email">
              <span className="block truncate">{user.email}</span>
            </SummaryRow>

            <SummaryRow icon={Shield} label="Status">
              <Badge
                variant={user.emailVerified ? "success" : "secondary"}
                className="h-6 px-2.5"
              >
                {user.emailVerified ? "Verified" : "Pending"}
              </Badge>
            </SummaryRow>
          </div>
        </SectionCard>

        <SectionCard
          title="Default Shipping"
          action={
            <Button asChild size="sm" variant="ghost" className="-mr-1.5">
              <Link href="/account/addresses">
                <Pencil className="size-3.5" aria-hidden />
                Edit
              </Link>
            </Button>
          }
        >
          <div className="space-y-4">
            <SummaryRow icon={User} label="Recipient">
              <span className="block truncate">{user.fullName}</span>
            </SummaryRow>

            <SummaryRow icon={MapPin} label="Address" align="start">
              {addressPending ? (
                <span className="text-muted-foreground">Loading…</span>
              ) : defaultAddress ? (
                // Positional lines: street, apartment, city, state, postcode.
                <span className="block text-pretty">
                  {defaultAddress.lines.filter(Boolean).join(", ")}
                </span>
              ) : (
                <span className="font-normal text-muted-foreground">No address set</span>
              )}
            </SummaryRow>

            {user.phone ? (
              <SummaryRow icon={Phone} label="Phone">
                <span className="tabular-nums">{user.phone}</span>
              </SummaryRow>
            ) : null}
          </div>
        </SectionCard>
      </div>

      {/* Recent orders */}
      <SectionCard
        title="Recent Orders"
        action={<ViewAllLink href="/account/orders" />}
        bodyClassName={recentOrders.length > 0 ? "px-0 pb-0" : undefined}
        divided={recentOrders.length > 0}
      >
        {ordersPending ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Loading orders…</p>
          </div>
        ) : recentOrders.length === 0 ? (
          <AccountEmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="Once you place an order it will show up here."
            action={
              <Button variant="outline" onClick={() => router.push("/products")}>
                Start Shopping
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Order
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    tabIndex={0}
                    role="link"
                    onClick={() => router.push(`/orders/${order.orderNumber}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/orders/${order.orderNumber}`);
                      }
                    }}
                    className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                  >
                    <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground">
                      {formatShortDate(order.placedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium tabular-nums whitespace-nowrap">
                      {formatMoney(order.totals.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Wishlist preview */}
      <SectionCard
        title={`My Wishlist${wishlistProducts.length ? ` (${wishlistItems.length})` : ""}`}
        action={<ViewAllLink href="/account/wishlist" />}
      >
        {wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <AccountEmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it for later."
            action={
              <Button variant="outline" onClick={() => router.push("/products")}>
                Explore Products
              </Button>
            }
          />
        )}
      </SectionCard>
    </AccountShell>
  );
}
