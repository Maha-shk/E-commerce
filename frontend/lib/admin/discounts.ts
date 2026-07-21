import {
  Sun,
  UserPlus,
  Zap,
  Crown,
  Gift,
  Sparkles,
  Truck,
  CalendarHeart,
  Snowflake,
  Percent,
  type LucideIcon,
} from "lucide-react";
import { formatEuro } from "./format";

export type DiscountType = "Percentage" | "Fixed Amount";

/** Badge shown in the Status column of the campaign table. */
export type DiscountStatus = "Active" | "Scheduled" | "Expired";

/** Lifecycle bucket that drives the Active / Scheduled / Archived tabs. */
export type DiscountCategory = "Active" | "Scheduled" | "Archived";

export type Discount = {
  id: string;
  name: string;
  code: string;
  type: DiscountType;
  /** Percentage → interpreted as a %, Fixed Amount → euro value. */
  value: number;
  status: DiscountStatus;
  category: DiscountCategory;
  /** Small leading glyph next to the campaign name. */
  icon: LucideIcon;
  usageLimit: number;
  /** MM/DD/YYYY — matches the edit modal date inputs. */
  startDate: string;
  endDate: string;
};

export const discountTypes: DiscountType[] = ["Percentage", "Fixed Amount"];

/** Options for the campaign table's status filter. */
export const discountStatuses: DiscountStatus[] = ["Active", "Scheduled", "Expired"];

/** Parses the stored MM/DD/YYYY form. Returns undefined for blank or malformed input. */
export function parseDate(value: string): Date | undefined {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!match) return undefined;
  const [, month, day, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  // Rejects overflow like 02/31/2026, which Date would silently roll forward.
  if (date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return undefined;
  return date;
}

/** Formats a Date into the MM/DD/YYYY form used across discount records. */
export function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}/${date.getFullYear()}`;
}

/* ---- Demo data (placeholder) ---- */
export const discounts: Discount[] = [
  {
    id: "DSC-1001",
    name: "Summer Solstice Sale",
    code: "SUMMER24",
    type: "Percentage",
    value: 20,
    status: "Active",
    category: "Active",
    icon: Sun,
    usageLimit: 1000,
    startDate: "06/01/2024",
    endDate: "08/31/2024",
  },
  {
    id: "DSC-1002",
    name: "New Customer Reward",
    code: "WELCOME10",
    type: "Fixed Amount",
    value: 10,
    status: "Active",
    category: "Active",
    icon: UserPlus,
    usageLimit: 5000,
    startDate: "01/01/2024",
    endDate: "12/31/2024",
  },
  {
    id: "DSC-1003",
    name: "Flash Clearance",
    code: "FLASH50",
    type: "Percentage",
    value: 50,
    status: "Expired",
    category: "Active",
    icon: Zap,
    usageLimit: 300,
    startDate: "03/10/2024",
    endDate: "03/12/2024",
  },
  {
    id: "DSC-1004",
    name: "VIP Loyalty Tier",
    code: "VIPGOLD",
    type: "Percentage",
    value: 15,
    status: "Active",
    category: "Active",
    icon: Crown,
    usageLimit: 750,
    startDate: "02/01/2024",
    endDate: "12/31/2024",
  },
  {
    id: "DSC-2001",
    name: "Black Friday Preview",
    code: "BLACKFRI",
    type: "Percentage",
    value: 40,
    status: "Scheduled",
    category: "Scheduled",
    icon: Sparkles,
    usageLimit: 2000,
    startDate: "11/25/2024",
    endDate: "11/29/2024",
  },
  {
    id: "DSC-2002",
    name: "Free Shipping Weekend",
    code: "FREESHIP",
    type: "Fixed Amount",
    value: 8,
    status: "Scheduled",
    category: "Scheduled",
    icon: Truck,
    usageLimit: 1500,
    startDate: "10/12/2024",
    endDate: "10/14/2024",
  },
  {
    id: "DSC-2003",
    name: "Anniversary Gift",
    code: "CENTO5YRS",
    type: "Percentage",
    value: 25,
    status: "Scheduled",
    category: "Scheduled",
    icon: Gift,
    usageLimit: 900,
    startDate: "09/15/2024",
    endDate: "09/22/2024",
  },
  {
    id: "DSC-3001",
    name: "Spring Refresh",
    code: "SPRING23",
    type: "Percentage",
    value: 30,
    status: "Expired",
    category: "Archived",
    icon: CalendarHeart,
    usageLimit: 1200,
    startDate: "03/01/2023",
    endDate: "05/31/2023",
  },
  {
    id: "DSC-3002",
    name: "Winter Warm-Up",
    code: "WINTER20",
    type: "Fixed Amount",
    value: 20,
    status: "Expired",
    category: "Archived",
    icon: Snowflake,
    usageLimit: 500,
    startDate: "11/01/2023",
    endDate: "01/31/2024",
  },
  {
    id: "DSC-3003",
    name: "Back to Business",
    code: "AUTUMN15",
    type: "Percentage",
    value: 15,
    status: "Expired",
    category: "Archived",
    icon: Percent,
    usageLimit: 640,
    startDate: "09/01/2023",
    endDate: "10/31/2023",
  },
];

/** Human-readable value for the table's Value column (20% or €10.00). */
export function formatDiscountValue(discount: Discount): string {
  return discount.type === "Percentage" ? `${discount.value}%` : formatEuro(discount.value);
}
