import Link from "next/link";
import { Download, Pencil, Trash2, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleReportButton } from "@/components/admin/ScheduleReportModal";
import {
  dashboardStats,
  monthlyPerformance,
  recentOrders,
  type RecentOrderStatus,
} from "@/lib/admin/dashboard";
import {
  products,
  formatCurrency,
  type ProductStatus,
} from "@/lib/admin/products";

const orderStatusVariant: Record<RecentOrderStatus, "secondary" | "success" | "info"> = {
  Processing: "secondary",
  Shipped: "success",
  Delivered: "info",
};

const stockStatusVariant: Record<ProductStatus, "success" | "warning" | "destructive"> = {
  "In Stock": "success",
  "Low Stock": "warning",
  "Out of Stock": "destructive",
};

const inventoryPreview = products.slice(0, 3);

function MonthlyPerformanceChart() {
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

        <div className="flex h-60 items-end gap-3 sm:gap-6">
          {monthlyPerformance.map((m) => (
            <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
              <div className="flex w-full flex-1 items-end justify-center gap-1.5">
                <div
                  className="w-4 rounded-t-md bg-primary transition-all sm:w-5"
                  style={{ height: `${m.revenue}%` }}
                />
                <div
                  className="w-4 rounded-t-md bg-slate-300 transition-all sm:w-5 dark:bg-slate-600"
                  style={{ height: `${m.orders}%` }}
                />
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-subtle">
                {m.month}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentOrdersCard() {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Recent Orders</h2>
        <Badge variant="navy">4 NEW</Badge>
      </div>

      <div className="flex-1 divide-y px-4">
        {recentOrders.slice(0, 3).map((order) => {
          const Icon = order.icon;
          return (
            <div key={order.id} className="flex items-center gap-3 py-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{order.id}</p>
                <p className="truncate text-xs text-subtle">{order.customer}</p>
              </div>
              <Badge variant={orderStatusVariant[order.status]}>{order.status}</Badge>
            </div>
          );
        })}
      </div>

      <div className="border-t p-3">
        <Button variant="ghost" className="w-full font-semibold text-primary">
          View All Orders
        </Button>
      </div>
    </Card>
  );
}

function ProductInventoryCard() {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="p-5">
        <h2 className="font-display text-lg font-semibold text-foreground">Product Inventory</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your product catalog and stock levels.
        </p>
      </div>

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
            {inventoryPreview.map((product) => (
              <tr key={product.id} className="hover:bg-muted/30">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-accent to-muted text-primary">
                      <Package className="size-4" />
                    </span>
                    <span className="font-semibold text-foreground">{product.name}</span>
                  </div>
                </td>
                <td className="px-2 py-3.5 whitespace-nowrap text-muted-foreground">{product.sku}</td>
                <td className="px-2 py-3.5 whitespace-nowrap text-muted-foreground">
                  {product.category}
                </td>
                <td className="px-2 py-3.5">
                  <Badge variant={stockStatusVariant[product.status]}>
                    <span className="size-1.5 rounded-full bg-current" />
                    {product.status}
                  </Badge>
                </td>
                <td className="px-2 py-3.5 font-semibold whitespace-nowrap text-foreground">
                  {formatCurrency(product.price)}
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
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${product.name}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t px-5 py-3">
        <p className="text-sm text-subtle">
          Showing {inventoryPreview.length} of {products.length} products
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next page">
            <ChevronRight />
          </Button>
        </div>
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {dashboardStats.map(({ label, value, icon: Icon, chip }) => (
          <Card key={label}>
            <CardContent className="flex flex-col items-center gap-2 text-center">
              <span className={`flex size-11 items-center justify-center rounded-full ${chip}`}>
                <Icon className="size-5" />
              </span>
              <p className="text-xs font-medium text-subtle">{label}</p>
              <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance + recent orders */}
      <div className="grid gap-6 lg:grid-cols-3">
        <MonthlyPerformanceChart />
        <RecentOrdersCard />
      </div>

      {/* Product inventory */}
      <ProductInventoryCard />
    </div>
  );
}
