"use client";

import Link from "next/link";
import {
  Download,
  Pencil,
  Trash2,
  Package,
  Wallet,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Truck,
  BadgeEuro,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleReportButton } from "@/components/admin/ScheduleReportModal";
import { DeleteConfirmButton } from "@/components/admin/DeleteConfirmButton";
import { ErrorState, LoadingState, Skeleton, TableSkeleton } from "@/components/admin/QueryState";
import {
  useDashboardStats,
  useDeleteProduct,
  useMonthlyPerformance,
  useProducts,
  useRecentOrders,
} from "@/lib/hooks/use-admin";
import { formatCompact, formatEuro } from "@/lib/admin/format";
import { orderStatusLabel, stockStatusLabel, type OrderStatus, type StockStatus } from "@/lib/api/models";

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

function StatCards() {
  const { data, isLoading, isError, error, refetch } = useDashboardStats();

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const cards: { label: string; value: string; icon: LucideIcon; chip: string }[] = [
    {
      label: "Total Sales",
      value: data ? formatEuro(data.totalSales) : "—",
      icon: Wallet,
      chip: "bg-accent text-primary",
    },
    {
      label: "Active Orders",
      value: data ? String(data.activeOrders) : "—",
      icon: ShoppingBag,
      chip: "bg-info-muted text-info",
    },
    {
      label: "Conversion",
      value: data ? `${data.conversionRate}%` : "—",
      icon: TrendingUp,
      chip: "bg-[#efe9fb] text-[#6d55d6] dark:bg-[#6d55d6]/20",
    },
    {
      label: "Avg. Order",
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
      icon: BadgeEuro,
      chip: "bg-success-muted text-success",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ label, value, icon: Icon, chip }) => (
        <Card key={label}>
          <CardContent className="flex flex-col items-center gap-2 text-center">
            <span className={`flex size-11 items-center justify-center rounded-full ${chip}`}>
              <Icon className="size-5" />
            </span>
            <p className="text-xs font-medium text-subtle">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MonthlyPerformanceChart() {
  const { data, isLoading, isError, error, refetch } = useMonthlyPerformance(6);

  // Bars are drawn as a percentage of the largest value in the window.
  const maxRevenue = Math.max(1, ...(data ?? []).map((m) => m.revenue));
  const maxOrders = Math.max(1, ...(data ?? []).map((m) => m.orders));

  return (
    <Card className="lg:col-span-2">
      <CardContent className="flex h-full flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Monthly Performance</h2>
          <div className="flex items-center gap-4 text-xs font-medium text-subtle">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-primary" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              Orders
            </span>
          </div>
        </div>

        {isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <LoadingState label="Loading performance…" />
        ) : (
          <div className="flex h-60 items-end gap-3 sm:gap-6">
            {(data ?? []).map((m) => (
              <div
                key={m.month}
                className="flex h-full flex-1 flex-col items-center justify-end gap-3"
              >
                <div className="flex w-full flex-1 items-end justify-center gap-1.5">
                  <div
                    className="w-4 rounded-t-md bg-primary transition-all sm:w-5"
                    style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                    title={`Revenue: ${formatEuro(m.revenue)}`}
                  />
                  <div
                    className="w-4 rounded-t-md bg-slate-300 transition-all sm:w-5 dark:bg-slate-600"
                    style={{ height: `${(m.orders / maxOrders) * 100}%` }}
                    title={`Orders: ${m.orders}`}
                  />
                </div>
                <span className="text-xs font-medium uppercase tracking-wide text-subtle">
                  {m.month}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentOrdersCard() {
  const { data, isLoading, isError, error, refetch } = useRecentOrders(4);

  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Recent Orders</h2>
        {data?.length ? <Badge variant="navy">{data.length} NEW</Badge> : null}
      </div>

      <div className="flex-1 divide-y px-4">
        {isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <LoadingState label="Loading orders…" />
        ) : data?.length ? (
          data.slice(0, 3).map((order) => (
            <div key={order.id} className="flex items-center gap-3 py-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                <Package className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
                <p className="truncate text-xs text-subtle">{order.customer}</p>
              </div>
              <Badge variant={orderStatusVariant[order.status]}>
                {orderStatusLabel[order.status]}
              </Badge>
            </div>
          ))
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">No orders yet.</p>
        )}
      </div>

      <div className="border-t p-3">
        <Button asChild variant="ghost" className="w-full font-semibold text-primary">
          <Link href="/admin/orders">View All Orders</Link>
        </Button>
      </div>
    </Card>
  );
}

function ProductInventoryCard() {
  const { data, isLoading, isError, error, refetch } = useProducts({ limit: 5 });
  const deleteProduct = useDeleteProduct();

  const products = data?.data ?? [];

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="p-5">
        <h2 className="font-display text-lg font-semibold text-foreground">Product Inventory</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your product catalog and stock levels.
        </p>
      </div>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-sm">
            <thead className="border-y bg-muted/50 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th className="px-5 py-3 text-left">Product Name</th>
                <th className="px-2 py-3 text-left">SKU</th>
                <th className="px-2 py-3 text-left">Category</th>
                <th className="px-2 py-3 text-left">Stock Status</th>
                <th className="px-2 py-3 text-left">Price</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <TableSkeleton rows={3} columns={6} />
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    No products yet.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-accent to-muted text-primary">
                          <Package className="size-4" />
                        </span>
                        <span className="font-semibold text-foreground">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3.5 whitespace-nowrap text-muted-foreground">
                      {product.sku}
                    </td>
                    <td className="px-2 py-3.5 whitespace-nowrap text-muted-foreground">
                      {product.category?.name ?? "—"}
                    </td>
                    <td className="px-2 py-3.5">
                      <Badge variant={stockStatusVariant[product.status]}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {stockStatusLabel[product.status]}
                      </Badge>
                    </td>
                    <td className="px-2 py-3.5 font-semibold whitespace-nowrap text-foreground">
                      {formatEuro(product.price)}
                    </td>
                    <td className="px-5 py-3.5">
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

      <div className="flex items-center justify-between border-t px-5 py-3">
        <p className="text-sm text-subtle">
          Showing {products.length} of {data?.meta.total ?? 0} products
        </p>
        <Button asChild variant="ghost" size="sm" className="font-semibold text-primary">
          <Link href="/admin/products">View all</Link>
        </Button>
      </div>
    </Card>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Monitor sales performance and inventory health."
        action={
          <div className="flex items-center gap-2">
            <ScheduleReportButton />
            <Button size="xl">
              <Download />
              Export Data
            </Button>
          </div>
        }
      />

      <StatCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <MonthlyPerformanceChart />
        <RecentOrdersCard />
      </div>

      <ProductInventoryCard />
    </div>
  );
}
