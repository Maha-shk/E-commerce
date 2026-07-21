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

export type ReportTabKey = "orders" | "sales" | "products";

/** One row of a detailed report. Column meanings vary by tab — see ReportView.columns. */
export type ReportRow = {
  id: string;
  /** Avatar initials shown in the leading Image column. */
  initials: string;
  /** Bold primary line. */
  title: string;
  /** Muted line beneath the title. */
  subtitle: string;
  /** Third column (order ID / channel code / SKU). */
  reference: string;
  /** Fourth column (category / period). */
  detail: string;
  amount: number;
  status: ReportStatus;
};

/** Everything that changes when a report tab is selected. */
export type ReportView = {
  key: ReportTabKey;
  label: string;
  metrics: ReportMetric[];
  /** Headings for the columns whose meaning shifts per report. */
  columns: { primary: string; reference: string; detail: string; amount: string };
  rows: ReportRow[];
  /** Static footer summary for the table. */
  totalEntries: string;
};

/* ---- Filter options ---- */
/** Category options are derived per tab from the active report's rows. */
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

/* ---- Per-tab report views (mock) ---- */
export const reportViews: ReportView[] = [
  {
    key: "orders",
    label: "Orders Report",
    metrics: reportMetrics,
    columns: {
      primary: "Customer Name",
      reference: "Transaction ID",
      detail: "Product Category",
      amount: "Amount",
    },
    totalEntries: "2,492",
    rows: transactions.map((tx) => ({
      id: tx.id,
      initials: tx.customer.initials,
      title: tx.customer.name,
      subtitle: tx.date,
      reference: tx.id,
      detail: tx.category,
      amount: tx.amount,
      status: tx.status,
    })),
  },
  {
    key: "sales",
    label: "Sales Report",
    metrics: [
      { label: "Gross Sales", value: formatEuro(301370), trend: { direction: "up", text: "+9.4%" } },
      {
        label: "Net Sales",
        value: formatEuro(297250),
        trend: { direction: "up", text: "+8.1%" },
      },
      { label: "Units Sold", value: "8,164", trend: { direction: "up", text: "+6.7%" } },
      {
        label: "Refund Rate",
        value: "1.37%",
        trend: { direction: "down", text: "-0.4%" },
      },
    ],
    columns: {
      primary: "Sales Channel",
      reference: "Channel Code",
      detail: "Period",
      amount: "Revenue",
    },
    totalEntries: "48",
    rows: [
      {
        id: "SLS-WEB",
        initials: "OS",
        title: "Online Storefront",
        subtitle: "Direct web checkout",
        reference: "SLS-WEB",
        detail: "Oct 2023",
        amount: 128400,
        status: "Completed",
      },
      {
        id: "SLS-AMZ",
        initials: "MP",
        title: "Marketplace Partners",
        subtitle: "Amazon, eBay and Zalando",
        reference: "SLS-AMZ",
        detail: "Oct 2023",
        amount: 86200,
        status: "Completed",
      },
      {
        id: "SLS-RTL",
        initials: "RT",
        title: "Retail Distribution",
        subtitle: "Wholesale to partner stores",
        reference: "SLS-RTL",
        detail: "Oct 2023",
        amount: 54920,
        status: "Processing",
      },
      {
        id: "SLS-FLD",
        initials: "FS",
        title: "Field Sales Team",
        subtitle: "Direct enterprise contracts",
        reference: "SLS-FLD",
        detail: "Oct 2023",
        amount: 31850,
        status: "Completed",
      },
      {
        id: "SLS-REF",
        initials: "RA",
        title: "Refunds & Adjustments",
        subtitle: "Returned and cancelled orders",
        reference: "SLS-REF",
        detail: "Oct 2023",
        amount: -4120,
        status: "Returned",
      },
    ],
  },
  {
    key: "products",
    label: "Products Report",
    metrics: [
      { label: "Products Sold", value: "8,164", trend: { direction: "up", text: "+6.7%" } },
      {
        label: "Top Category",
        value: "UAV Systems",
        trend: { direction: "up", text: "+18.2%" },
      },
      { label: "Out of Stock", value: "7", trend: { direction: "down", text: "-3 items" } },
      {
        label: "Avg. Margin",
        value: "34.6%",
        trend: { direction: "stable", text: "Stable" },
      },
    ],
    columns: {
      primary: "Product Name",
      reference: "SKU",
      detail: "Category",
      amount: "Revenue",
    },
    totalEntries: "312",
    rows: [
      {
        id: "AS-900-PR",
        initials: "AD",
        title: "AeroScan Precision Drone",
        subtitle: "142 units sold",
        reference: "AS-900-PR",
        detail: "UAV Systems",
        amount: 177485,
        status: "Completed",
      },
      {
        id: "VP-5000-X",
        initials: "CV",
        title: "Cento Volt-Pack",
        subtitle: "268 units sold",
        reference: "VP-5000-X",
        detail: "Power Solutions",
        amount: 113900,
        status: "Completed",
      },
      {
        id: "ISH-42-GEN3",
        initials: "IS",
        title: "Industrial Sensor Hub",
        subtitle: "410 units sold",
        reference: "ISH-42-GEN3",
        detail: "Infrastructure",
        amount: 77490,
        status: "Processing",
      },
      {
        id: "CS-PRD-00123",
        initials: "PL",
        title: "Premium Leather Ergonomic Chair",
        subtitle: "1,205 units sold",
        reference: "CS-PRD-00123",
        detail: "Furniture & Office",
        amount: 300045,
        status: "Completed",
      },
      {
        id: "HS-220-AUD",
        initials: "HS",
        title: "Halo Studio Headphones",
        subtitle: "96 units returned",
        reference: "HS-220-AUD",
        detail: "Audio",
        amount: -21024,
        status: "Returned",
      },
    ],
  },
];
