import { Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  conversationOrderStatusVariant,
  formatEuro,
  type Conversation,
} from "@/lib/admin/messages";

const accountStatusVariant: Record<Conversation["accountStatus"], "success" | "warning" | "info"> = {
  Active: "success",
  VIP: "warning",
  New: "info",
};

/** Right-hand customer profile + recent orders panel. */
export function CustomerInfoCard({ conversation }: { conversation: Conversation }) {
  const { customer, totalOrders, totalSpent, customerSince, accountStatus, recentOrders } =
    conversation;

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
              <p className="font-display text-base font-semibold text-foreground">
                {customer.name}
              </p>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="size-3.5 text-subtle" />
                {customer.email}
              </p>
              <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="size-3.5 text-subtle" />
                {customer.phone}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 border-t pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-subtle">Total Orders</span>
              <span className="font-semibold text-foreground">{totalOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-subtle">Total Spending</span>
              <span className="font-semibold text-foreground">{formatEuro(totalSpent)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-subtle">Customer Since</span>
              <span className="font-medium text-foreground">{customerSince}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-subtle">Current Status</span>
              <Badge variant={accountStatusVariant[accountStatus]}>{accountStatus}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b px-4 py-3">
          <h3 className="font-display text-sm font-semibold text-foreground">Recent Orders</h3>
        </div>
        <div className="divide-y">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{order.id}</p>
                <p className="text-xs text-subtle">{order.date}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {formatEuro(order.amount)}
                </span>
                <Badge variant={conversationOrderStatusVariant[order.status]} className="uppercase">
                  {order.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
