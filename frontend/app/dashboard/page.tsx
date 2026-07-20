import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  Heart,
  MapPin,
  ChevronRight,
  Package,
  Sparkles,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type BadgeVariant = "success" | "info" | "warning" | "destructive";

/* ---- Demo data (placeholder — replace when real data arrives) ---- */
const stats: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  chip: string;
}[] = [
  { label: "Total Orders", value: "24", hint: "+3 this month", icon: ShoppingBag, chip: "bg-accent text-primary" },
  { label: "In Transit", value: "2", hint: "Arriving soon", icon: Truck, chip: "bg-info-muted text-info" },
  { label: "Wishlist", value: "12", hint: "items saved", icon: Heart, chip: "bg-destructive/10 text-destructive" },
  { label: "Addresses", value: "3", hint: "1 default", icon: MapPin, chip: "bg-success-muted text-success" },
];

const recentOrders: {
  id: string;
  item: string;
  date: string;
  total: string;
  status: string;
  variant: BadgeVariant;
}[] = [
  { id: "#ORD-10245", item: "Aurora Mechanical Keyboard", date: "Jul 14, 2026", total: "$189.00", status: "Delivered", variant: "success" },
  { id: "#ORD-10238", item: "Nebula Wireless Mouse", date: "Jul 11, 2026", total: "$59.00", status: "Shipped", variant: "info" },
  { id: "#ORD-10231", item: 'Lumen 27" 4K Monitor', date: "Jul 09, 2026", total: "$429.00", status: "Processing", variant: "warning" },
  { id: "#ORD-10226", item: "Vortex USB-C Hub", date: "Jul 02, 2026", total: "$39.00", status: "Cancelled", variant: "destructive" },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome back, Arthur"
        subtitle="Here's what's happening with your account today."
        action={
          <Button asChild variant="outline" size="xl">
            <Link href="/dashboard/orders">
              View all orders
              <ChevronRight />
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon, chip }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-3">
              <span className={`flex size-11 items-center justify-center rounded-lg ${chip}`}>
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="mt-0.5 text-xs text-subtle">{hint}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent orders + side panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Recent Orders</CardTitle>
            <CardAction>
              <Link
                href="/dashboard/orders"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                See all
                <ChevronRight className="size-4" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="divide-y">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                  <Package className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{order.item}</p>
                  <p className="text-xs text-subtle">
                    {order.id} · {order.date}
                  </p>
                </div>
                <p className="hidden text-sm font-semibold text-foreground sm:block">{order.total}</p>
                <Badge variant={order.variant}>
                  <span className="size-1.5 rounded-full bg-current" />
                  {order.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Profile completion */}
          <Card>
            <CardHeader>
              <CardTitle>Profile completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">80% complete</span>
                <span className="font-semibold text-foreground">4 / 5</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-4/5 rounded-full bg-green" />
              </div>
              <p className="mt-3 text-xs text-subtle">
                Add a payment method to finish setting up your account.
              </p>
              <Button asChild variant="ghost" size="sm" className="mt-2 -ml-2.5 text-primary">
                <Link href="/dashboard/profile">
                  Complete profile
                  <ArrowUpRight />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Promo */}
          <Card className="bg-primary text-primary-foreground ring-0">
            <CardContent>
              <div className="flex items-center gap-2 text-green">
                <Sparkles className="size-5" />
                <p className="text-sm font-semibold">Members Offer</p>
              </div>
              <p className="mt-2 font-display text-lg font-semibold leading-snug">
                Enjoy free express shipping on your next order.
              </p>
              <p className="mt-1 text-sm text-primary-foreground/70">
                Automatically applied at checkout this month.
              </p>
              <Button asChild variant="green" size="xl" className="mt-4">
                <Link href="/dashboard/wishlist">Shop your wishlist</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
