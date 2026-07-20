import {
  ShoppingCart,
  UserPlus,
  CreditCard,
  PackageX,
  TicketPercent,
  XCircle,
  FileBarChart,
  ShieldAlert,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type NotificationType = "success" | "info" | "warning" | "error";

export type NotificationCategory =
  | "Orders"
  | "Customers"
  | "Inventory"
  | "Discounts"
  | "Reports"
  | "System";

export type Notification = {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  icon: LucideIcon;
  title: string;
  description: string;
  time: string;
  unread: boolean;
};

export type NotificationGroup = {
  label: string;
  items: Notification[];
};

/** Filter tabs (presentational — no filtering wired up yet). */
export const notificationTabs = [
  "All",
  "Unread",
  "Orders",
  "Customers",
  "Inventory",
  "Discounts",
  "Reports",
  "System",
] as const;

/* ---- Demo data (placeholder), grouped by recency ---- */
export const notificationGroups: NotificationGroup[] = [
  {
    label: "Today",
    items: [
      {
        id: "N-01",
        type: "success",
        category: "Orders",
        icon: ShoppingCart,
        title: "New Order Received",
        description: "Order #ORD-8852 from Elena Bianchi for €1,240.00.",
        time: "2 min ago",
        unread: true,
      },
      {
        id: "N-02",
        type: "info",
        category: "Customers",
        icon: UserPlus,
        title: "Customer Registration",
        description: "Antonio Bruno created a new account.",
        time: "24 min ago",
        unread: true,
      },
      {
        id: "N-03",
        type: "success",
        category: "Orders",
        icon: CreditCard,
        title: "Payment Successful",
        description: "Payment of €420.50 for order #ORD-8483 was captured.",
        time: "1 hour ago",
        unread: false,
      },
    ],
  },
  {
    label: "Yesterday",
    items: [
      {
        id: "N-04",
        type: "warning",
        category: "Inventory",
        icon: PackageX,
        title: "Product Out of Stock",
        description: "“Wireless Keyboard K380” has reached zero stock.",
        time: "Yesterday, 6:12 PM",
        unread: false,
      },
      {
        id: "N-05",
        type: "info",
        category: "Discounts",
        icon: TicketPercent,
        title: "Discount Campaign Started",
        description: "“Summer Solstice Sale” (SUMMER24) is now active.",
        time: "Yesterday, 9:00 AM",
        unread: false,
      },
      {
        id: "N-06",
        type: "error",
        category: "Orders",
        icon: XCircle,
        title: "Order Cancelled",
        description: "Order #ORD-8849 was cancelled by the customer.",
        time: "Yesterday, 8:41 AM",
        unread: false,
      },
    ],
  },
  {
    label: "Earlier",
    items: [
      {
        id: "N-07",
        type: "info",
        category: "Reports",
        icon: FileBarChart,
        title: "Monthly Sales Report Ready",
        description: "Your October performance report is available to download.",
        time: "Oct 21, 2024",
        unread: false,
      },
      {
        id: "N-08",
        type: "warning",
        category: "System",
        icon: ShieldAlert,
        title: "Security Login Alert",
        description: "New sign-in from Milan, Italy on Chrome (Windows).",
        time: "Oct 20, 2024",
        unread: false,
      },
      {
        id: "N-09",
        type: "info",
        category: "Inventory",
        icon: Warehouse,
        title: "Inventory Updated",
        description: "Stock levels synced for 128 products across 4 categories.",
        time: "Oct 19, 2024",
        unread: false,
      },
    ],
  },
];

/** Total unread across all groups — used for the tab counter. */
export const unreadCount = notificationGroups
  .flatMap((g) => g.items)
  .filter((n) => n.unread).length;
