import { Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatEuro } from "@/lib/admin/format";
import { userStatusLabel, type ConversationDetail } from "@/lib/api/models";

const accountStatusVariant: Record<"ACTIVE" | "VIP" | "NEW", "success" | "warning" | "info"> = {
  ACTIVE: "success",
  VIP: "warning",
  NEW: "info",
};

/** Right-hand customer profile + recent orders panel. */
export function CustomerInfoCard({ conversation }: { conversation: ConversationDetail }) {
  const { customer, totalOrders, totalSpent, recentOrders } = conversation;
  const customerSince = new Date(customer.createdAt).toLocaleDateString();

  return (
    <div className="space-y-4">
      {/* Customer profile */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <Avatar className="size-16">
              <AvatarFallback className="bg-primary font-display text-lg font-semibold text-primary-foreground">
                {customer.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-display text-lg font-semibold text-foreground">{customer.fullName}</p>
              <p className="text-xs text-subtle">{customer.email}</p>
            </div>
            <Badge variant={accountStatusVariant[customer.status as keyof typeof accountStatusVariant] || "info"}>
              {userStatusLabel[customer.status]}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Orders</p>
              <p className="font-display text-lg font-semibold text-foreground">{totalOrders}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Spent</p>
              <p className="font-display text-lg font-semibold text-foreground">{formatEuro(totalSpent)}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Mail className="size-3.5 text-subtle" />
              <span className="text-muted-foreground">{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-1">
                <Phone className="size-3.5 text-subtle" />
                <span className="text-muted-foreground">{customer.phone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card>
        <CardContent className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Orders</h3>
          {recentOrders.length > 0 ? (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-input bg-muted/30 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-subtle">{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatEuro(order.amount)}</p>
                    <p className="text-xs text-muted-foreground">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No recent orders</p>
          )}
        </CardContent>
      </Card>

      {/* Customer since */}
      <div className="text-center">
        <p className="text-xs text-subtle">Customer since {customerSince}</p>
      </div>
    </div>
  );
}
