import { formatEuro } from "./format";

export { formatEuro };

export type ReportStatus = "Completed" | "Processing" | "Returned";

export type TrendDirection = "up" | "down" | "stable";

export type ReportMetric = {
  label: string;
  value: string;
  trend: { direction: TrendDirection; text: string };
};

export type Transaction = {
  id: string;
  customer: { name: string; initials: string };
  date: string;
  category: string;
  amount: number;
  status: ReportStatus;
};

/** Presentational report tabs — no switching logic wired up yet. */
export const reportTabs = ["Orders Report", "Sales Report", "Products Report"] as const;

/* ---- Filter options (static placeholders) ---- */
export const reportCategories = [
  "All Categories",
  "Electronics",
  "Home & Living",
  "Fashion",
  "Beauty",
];

export const reportStatusOptions = ["All Statuses", "Completed", "Processing", "Returned"];

/* ---- Summary metrics (mock) ---- */
export const reportMetrics: ReportMetric[] = [
  { label: "Total Revenue", value: formatEuro(42904), trend: { direction: "up", text: "+12.5%" } },
  {
    label: "Average Order Value",
    value: formatEuro(158.2),
    trend: { direction: "stable", text: "Stable" },
  },
  { label: "Conversion Rate", value: "3.24%", trend: { direction: "down", text: "-0.8%" } },
  { label: "Active Sessions", value: "1,402", trend: { direction: "up", text: "+4.2%" } },
];

/* ---- Detailed breakdown rows (mock) ---- */
export const transactions: Transaction[] = [
  {
    id: "#TRX-9482",
    customer: { name: "Alexander Vance", initials: "AV" },
    date: "Oct 24, 2023",
    category: "Electronics",
    amount: 1299,
    status: "Completed",
  },
  {
    id: "#TRX-9483",
    customer: { name: "Elena Rodriguez", initials: "ER" },
    date: "Oct 24, 2023",
    category: "Home & Living",
    amount: 420.5,
    status: "Processing",
  },
  {
    id: "#TRX-9484",
    customer: { name: "Marcus Thorne", initials: "MT" },
    date: "Oct 23, 2023",
    category: "Fashion",
    amount: 89,
    status: "Returned",
  },
  {
    id: "#TRX-9485",
    customer: { name: "Sarah Jenkins", initials: "SJ" },
    date: "Oct 23, 2023",
    category: "Electronics",
    amount: 2450,
    status: "Completed",
  },
];
