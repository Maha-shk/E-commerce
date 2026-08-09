"use client";

import Link from "next/link";
import {
  ArrowRight,
  Download,
  Pencil,
  Trash2,
  Wallet,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmButton } from "@/components/admin/DeleteConfirmButton";
import { MiniBarChart } from "@/components/admin/MiniBarChart";
import { ProductThumb } from "@/components/admin/ProductThumb";
import { ErrorState, LoadingState, Skeleton, TableSkeleton } from "@/components/admin/QueryState";
import {
  useDashboardStats,
  useDeleteProduct,
  useMonthlyPerformance,
  useProducts,
  useRecentOrders,
} from "@/lib/hooks/use-admin";
import { formatCompact, formatEuro } from "@/lib/admin/format";
import { downloadCsv } from "@/lib/admin/csv";
import { cn } from "@/lib/utils";
import {
  orderStatusLabel,
  stockStatusLabel,
  type OrderStatus,
  type StockStatus,
} from "@/lib/api/models";

const RECENT_ORDER_COUNT = 5;
const INVENTORY_PREVIEW_COUNT = 5;

const orderStatusVariant: Record<OrderStatus, "secondary" | "success" | "info" | "destructive"> = {
  PENDING: "secondary",
  PROCESSING: "secondary",
  SHIPPED: "success",
  DELIVERED: "info",
  CANCELLED: "destructive",
  RETURNED: "destructive",
};

const stockStatusVariant: Record<StockStatus, "success" | "warning" | "destructive"> = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  OUT_OF_STOCK: "destructive",
};

/** Section shell so every panel on the page shares one header treatment. */
function Panel({
  title,
  description,
  action,
  children,
  bodyClassName,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 pt-5 pb-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={bodyClassName ?? "px-5 py-5"}>{children}</div>
    </Card>
  );
}

function StatCards() {
  const { data, isLoading, isError, error, refetch } = useDashboardStats();

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const cards: { label: string; value: string; icon: LucideIcon; chip: string }[] = [
    {
      label: "Total sales",
      value: data ? formatEuro(data.totalSales) : "—",
      icon: Wallet,
      chip: "bg-accent text-primary",
    },
    {
      label: "Active orders",
      value: data ? String(data.activeOrders) : "—",
      icon: ShoppingBag,
      chip: "bg-info-muted text-info",
    },
    {
      label: "Conversion",
      value: data ? `${data.conversionRate}%` : "—",
      icon: TrendingUp,
      chip: "bg-green-muted text-green",
    },
    {
      label: "Avg. order",
      value: data ? formatEuro(data.averageOrderValue) : "—",
      icon: Receipt,
      chip: "bg-warning-muted text-warning",
    },
    {
      label: "Pending",
      value: data ? String(data.pendingOrders) : "—",
      icon: Truck,
      chip: "bg-destructive/10 text-destructive",
    },
    {
      label: "Customers",
      value: data ? formatCompact(data.totalCustomers) : "—",
      icon: Users,
      chip: "bg-success-muted text-success",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ label, value, icon: Icon, chip }) => (
        <Card key={label} className="gap-0 py-0">
          {/* Left-aligned: six centred cards were slower to scan, and the
              number is the thing being compared across the row. */}
          <div className="flex items-start justify-between gap-2 p-4">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-subtle">{label}</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-7 w-20" />
              ) : (
                <p className="mt-1.5 text-xl font-semibold tracking-tight tabular-nums text-foreground">
                  {value}
                </p>
              )}
            </div>
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full ${chip}`}
            >
              <Icon className="size-4" aria-hidden />
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MonthlyPerformance() {
  const { data, isLoading, isError, error, refetch } = useMonthlyPerformance(6);
  const months = data ?? [];

  const totalRevenue = months.reduce((sum, m) => sum + m.revenue, 0);
  const totalOrders = months.reduce((sum, m) => sum + m.orders, 0);

  return (
    <Panel
      className="lg:col-span-2"
      title="Monthly Performance"
      description="Last 6 months"
      action={
        months.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCsv("monthly-performance.csv", ["Month", "Revenue", "Orders"], months.map(
                (m) => [m.month, m.revenue.toFixed(2), String(m.orders)],
              ))
            }
          >
            <Download className="size-4" aria-hidden />
            Export
          </Button>
        ) : null
      }
    >
      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <LoadingState label="Loading performance…" />
      ) : months.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No performance data yet.
        </p>
      ) : (
        /*
         * Small multiples, not a dual-axis plot. Revenue (€) and orders (a
         * count) have no common scale, so drawing them as adjacent bars in one
         * plot made their relative heights meaningless.
         */
        <div className="grid gap-6 sm:grid-cols-2">
          <MiniBarChart
            title="Revenue"
            data={months.map((m) => ({ label: m.month, value: m.revenue }))}
            formatValue={formatEuro}
            summary={`${formatEuro(totalRevenue)} total`}
          />
          <MiniBarChart
            title="Orders"
            data={months.map((m) => ({ label: m.month, value: m.orders }))}
            formatValue={(v) => v.toLocaleString()}
            summary={`${totalOrders.toLocaleString()} total`}
          />
        </div>
      )}
    </Panel>
  );
}

function RecentOrders() {
  const { data, isLoading, isError, error, refetch } = useRecentOrders(RECENT_ORDER_COUNT);
  const orders = data ?? [];

  return (
    <Card className="flex flex-col gap-0 py-0">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 pt-5 pb-4">
        <h2 className="text-base font-semibold tracking-tight text-foreground">Recent Orders</h2>
        {/* Was `{data.length} NEW` — the count of rows fetched, not new orders. */}
        <Badge variant="secondary" className="h-6 px-2.5 tabular-nums">
          Latest {orders.length}
        </Badge>
      </div>

      {/*
       * Scrolls internally instead of growing the card.
       *
       * This sits in a grid beside the performance chart. Letting the list set
       * its own height meant every extra order made the column taller than the
       * chart and knocked the row out of alignment — the taller each order row
       * rendered (long order numbers, long customer names), the worse it got.
       */}
      <div className="max-h-80 flex-1 overflow-y-auto">
        {isError ? (
          <div className="px-5 py-5">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        ) : isLoading ? (
          <div className="px-5 py-5">
            <LoadingState label="Loading orders…" />
          </div>
        ) : orders.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href="/admin/orders"
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground tabular-nums">
                      {order.orderNumber}
                    </p>
                    <p className="truncate text-xs text-subtle">{order.customer}</p>
                  </div>
                  <Badge variant={orderStatusVariant[order.status]} className="h-6 shrink-0 px-2.5">
                    {orderStatusLabel[order.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border p-3">
        <Button asChild variant="ghost" className="w-full">
          <Link href="/admin/orders">
            View all orders
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function ProductInventory() {
  const { data, isLoading, isError, error, refetch } = useProducts({
    limit: INVENTORY_PREVIEW_COUNT,
  });
  const deleteProduct = useDeleteProduct();
  const products = data?.data ?? [];

  return (
    <Panel
      title="Product Inventory"
      description="Your most recently updated products."
      bodyClassName="p-0"
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/products">
            View all
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      }
    >
      {isError ? (
        <div className="px-5 py-5">
          <ErrorState error={error} onRetry={() => refetch()} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-3xl text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold tracking-wider text-subtle uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Product</th>
                <th className="px-3 py-3 text-left">SKU</th>
                <th className="px-3 py-3 text-left">Category</th>
                <th className="px-3 py-3 text-left">Stock</th>
                <th className="px-3 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <TableSkeleton rows={INVENTORY_PREVIEW_COUNT} columns={6} />
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No products yet.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {/* Real product image — every row used to show the same
                            generic package icon. */}
                        <ProductThumb src={product.images?.[0]} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground">
                            {product.name}
                          </span>
                          {product.brand ? (
                            <span className="block truncate text-xs text-subtle">
                              {product.brand}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                      {product.sku}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={stockStatusVariant[product.status]} className="h-6 px-2.5">
                        <span className="size-1.5 rounded-full bg-current" />
                        {stockStatusLabel[product.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right font-medium whitespace-nowrap tabular-nums text-foreground">
                      {formatEuro(product.price)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Pencil />
                          </Link>
                        </Button>
                        <DeleteConfirmButton
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${product.name}`}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          title="Delete product?"
                          description={
                            <>
                              <strong className="font-semibold text-foreground">
                                {product.name}
                              </strong>{" "}
                              will be permanently removed. This action cannot be undone.
                            </>
                          }
                          confirmLabel="Delete product"
                          onConfirm={() => deleteProduct.mutate(product.id)}
                        >
                          <Trash2 />
                        </DeleteConfirmButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-border px-5 py-3">
        <p className="text-sm text-subtle">
          Showing <span className="font-medium text-foreground tabular-nums">{products.length}</span>{" "}
          of <span className="font-medium text-foreground tabular-nums">{data?.meta.total ?? 0}</span>{" "}
          products
        </p>
      </div>
    </Panel>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* The old header carried an "Export Data" button with no onClick — it
          did nothing at all. Export now lives on the panel whose data it
          actually exports. */}
      <PageHeader
        title="Dashboard"
        subtitle="Monitor sales performance and inventory health."
      />

      <StatCards />

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <MonthlyPerformance />
        <RecentOrders />
      </div>

      <ProductInventory />
    </div>
  );
}
