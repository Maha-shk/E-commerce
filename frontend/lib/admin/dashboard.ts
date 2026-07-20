import type { LucideIcon } from "lucide-react";
import {
  Wallet,
  ShoppingBag,
  TrendingUp,
  Receipt,
  BadgeEuro,
  Truck,
  Package,
} from "lucide-react";

/* ---- Demo data (placeholder — replace when real data arrives) ---- */

export type DashboardStat = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon chip (background + foreground). */
  chip: string;
};

export const dashboardStats: DashboardStat[] = [
  { label: "Total Sales", value: "€124,50", icon: Wallet, chip: "bg-accent text-primary" },
  { label: "Active Orders", value: "42", icon: ShoppingBag, chip: "bg-info-muted text-info" },
  {
    label: "Conversion",
    value: "3.2%",
    icon: TrendingUp,
    chip: "bg-[#efe9fb] text-[#6d55d6] dark:bg-[#6d55d6]/20",
  },
  { label: "Avg. Order", value: "€2,964", icon: Receipt, chip: "bg-warning-muted text-warning" },
  { label: "Pending", value: "12", icon: Truck, chip: "bg-destructive/10 text-destructive" },
  { label: "Revenue", value: "€84k", icon: BadgeEuro, chip: "bg-success-muted text-success" },
];

export type MonthlyPoint = { month: string; revenue: number; orders: number };

/** Placeholder monthly series — values are relative heights (0–100) for the CSS bar chart. */
export const monthlyPerformance: MonthlyPoint[] = [
  { month: "Jan", revenue: 55, orders: 40 },
  { month: "Feb", revenue: 72, orders: 52 },
  { month: "Mar", revenue: 44, orders: 33 },
  { month: "Apr", revenue: 95, orders: 61 },
  { month: "May", revenue: 68, orders: 54 },
  { month: "Jun", revenue: 88, orders: 46 },
];

export type RecentOrderStatus = "Processing" | "Shipped" | "Delivered";

export type RecentOrder = {
  id: string;
  customer: string;
  status: RecentOrderStatus;
  icon: LucideIcon;
};

export const recentOrders: RecentOrder[] = [
  { id: "#CS-89241", customer: "Marco Rossi", status: "Processing", icon: Truck },
  { id: "#CS-89240", customer: "Lucia Bianchi", status: "Processing", icon: Truck },
  { id: "#CS-89239", customer: "Tech Solutions Ltd", status: "Shipped", icon: Package },
  { id: "#CS-89238", customer: "Giulia Ferrari", status: "Delivered", icon: Package },
];
