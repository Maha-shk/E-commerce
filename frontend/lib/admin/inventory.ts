import { productCategories } from "@/lib/admin/products";

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  status: StockStatus;
  /** Human-friendly relative time since the last stock change. */
  lastUpdated: string;
  /** Per-unit value used for the aggregate inventory value (USD). */
  unitValue: number;
};

/** Category options for the inventory filter (shared with the product catalog). */
export const inventoryCategories = productCategories;

export const stockStatuses: StockStatus[] = ["In Stock", "Low Stock", "Out of Stock"];

/* ---- Demo data (placeholder) ---- */
export const inventory: InventoryItem[] = [
  {
    id: "CS-SENS-001",
    name: "Industrial Sensor X-1",
    sku: "CS-SENS-001",
    category: "Infrastructure",
    stock: 840,
    status: "In Stock",
    lastUpdated: "2 hours ago",
    unitValue: 189,
  },
  {
    id: "CS-VALV-992",
    name: "Carbon Valve v4.2",
    sku: "CS-VALV-992",
    category: "Power Solutions",
    stock: 15,
    status: "Low Stock",
    lastUpdated: "5 hours ago",
    unitValue: 220,
  },
  {
    id: "CS-GEAR-441",
    name: "Brass Gear Assembly",
    sku: "CS-GEAR-441",
    category: "Infrastructure",
    stock: 0,
    status: "Out of Stock",
    lastUpdated: "1 day ago",
    unitValue: 95,
  },
  {
    id: "CS-OPTI-210",
    name: "Optical Lens Module",
    sku: "CS-OPTI-210",
    category: "Electronics",
    stock: 2400,
    status: "In Stock",
    lastUpdated: "just now",
    unitValue: 129,
  },
  {
    id: "SK-4421",
    name: "Industrial Valve 15mm-K",
    sku: "SK-4421",
    category: "Power Solutions",
    stock: 1248,
    status: "In Stock",
    lastUpdated: "3 hours ago",
    unitValue: 340,
  },
  {
    id: "CS-BATT-050",
    name: "AeroScan Drone Battery",
    sku: "CS-BATT-050",
    category: "UAV Systems",
    stock: 62,
    status: "In Stock",
    lastUpdated: "6 hours ago",
    unitValue: 480,
  },
  {
    id: "CS-FAST-118",
    name: "Titanium Fastener Kit",
    sku: "CS-FAST-118",
    category: "Accessories",
    stock: 8,
    status: "Low Stock",
    lastUpdated: "2 days ago",
    unitValue: 45,
  },
  {
    id: "CS-THRM-303",
    name: "Thermal Camera Unit",
    sku: "CS-THRM-303",
    category: "Electronics",
    stock: 0,
    status: "Out of Stock",
    lastUpdated: "4 days ago",
    unitValue: 2100,
  },
  {
    id: "CS-PUMP-777",
    name: "Hydraulic Pump Z9",
    sku: "CS-PUMP-777",
    category: "Power Solutions",
    stock: 320,
    status: "In Stock",
    lastUpdated: "1 hour ago",
    unitValue: 760,
  },
  {
    id: "CS-BEAR-204",
    name: "Precision Bearing Set",
    sku: "CS-BEAR-204",
    category: "Infrastructure",
    stock: 18,
    status: "Low Stock",
    lastUpdated: "3 days ago",
    unitValue: 68,
  },
  {
    id: "CS-COIL-560",
    name: "Copper Coil Spool",
    sku: "CS-COIL-560",
    category: "Power Solutions",
    stock: 145,
    status: "In Stock",
    lastUpdated: "5 days ago",
    unitValue: 88,
  },
  {
    id: "CS-SERV-810",
    name: "Servo Motor M8",
    sku: "CS-SERV-810",
    category: "Electronics",
    stock: 19,
    status: "Low Stock",
    lastUpdated: "7 hours ago",
    unitValue: 210,
  },
];
