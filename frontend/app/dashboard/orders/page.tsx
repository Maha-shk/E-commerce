import { Package, Truck, Search } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Status = "Processing" | "Shipped" | "Delivered" | "Cancelled";
type BadgeVariant = "success" | "info" | "warning" | "destructive";

const statusVariant: Record<Status, BadgeVariant> = {
  Delivered: "success",
  Shipped: "info",
  Processing: "warning",
  Cancelled: "destructive",
};

/* ---- Demo data (placeholder) ---- */
type Order = {
  id: string;
  date: string;
  status: Status;
  total: string;
  items: { name: string; qty: number; price: string }[];
};

const orders: Order[] = [
  {
    id: "#ORD-10245",
    date: "Jul 14, 2026",
    status: "Delivered",
    total: "$189.00",
    items: [
      { name: "Aurora Mechanical Keyboard", qty: 1, price: "$149.00" },
      { name: "Keycap Set — Ivory", qty: 1, price: "$40.00" },
    ],
  },
  {
    id: "#ORD-10238",
    date: "Jul 11, 2026",
    status: "Shipped",
    total: "$59.00",
    items: [{ name: "Nebula Wireless Mouse", qty: 1, price: "$59.00" }],
  },
  {
    id: "#ORD-10231",
    date: "Jul 09, 2026",
    status: "Processing",
    total: "$429.00",
    items: [{ name: 'Lumen 27" 4K Monitor', qty: 1, price: "$429.00" }],
  },
  {
    id: "#ORD-10226",
    date: "Jul 02, 2026",
    status: "Cancelled",
    total: "$39.00",
    items: [{ name: "Vortex USB-C Hub", qty: 1, price: "$39.00" }],
  },
];

const filters = ["All", "Processing", "Shipped", "Delivered", "Cancelled"] as const;

function OrderCard({ order }: { order: Order }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b">
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant[order.status]}>
            <span className="size-1.5 rounded-full bg-current" />
            {order.status}
          </Badge>
          <div>
            <p className="text-sm font-semibold text-foreground">{order.id}</p>
            <p className="text-xs text-subtle">Placed on {order.date}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-subtle">Total</p>
          <p className="text-sm font-semibold text-foreground">{order.total}</p>
        </div>
      </CardHeader>

      <CardContent className="divide-y">
        {order.items.map((item) => (
          <div key={item.name} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-accent to-muted text-primary">
              <Package className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
              <p className="text-xs text-subtle">Qty: {item.qty}</p>
            </div>
            <p className="text-sm font-medium text-foreground">{item.price}</p>
          </div>
        ))}
      </CardContent>

      <CardFooter className="justify-end gap-2 bg-transparent">
        {order.status === "Shipped" && (
          <Button variant="ghost" size="sm">
            <Truck />
            Track order
          </Button>
        )}
        <Button variant="outline" size="sm">
          View details
        </Button>
        <Button size="sm">Buy again</Button>
      </CardFooter>
    </Card>
  );
}

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Orders" subtitle="Track deliveries and review your purchase history." />

      <Tabs defaultValue="All">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-9">
            {filters.map((f) => (
              <TabsTrigger key={f} value={f} className="px-3">
                {f}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              type="search"
              placeholder="Search by order ID…"
              className="h-10 rounded-lg bg-card pl-9"
            />
          </div>
        </div>

        {filters.map((f) => {
          const list = f === "All" ? orders : orders.filter((o) => o.status === f);
          return (
            <TabsContent key={f} value={f} className="mt-5 space-y-4">
              {list.length > 0 ? (
                list.map((order) => <OrderCard key={order.id} order={order} />)
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-subtle">
                    No {f.toLowerCase()} orders yet.
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
