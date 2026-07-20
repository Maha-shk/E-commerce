export type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock";
export type ProductVisibility = "public" | "private" | "scheduled";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  sku: string;
  stock: number;
  status: ProductStatus;
  price: number;
  discount: number;
  images: string[];
  variants: string[];
  visibility: ProductVisibility;
  scheduledDate?: string;
  tags: string[];
};

/** Categories offered in the Add/Edit form + list filter. */
export const productCategories = [
  "Furniture & Office",
  "UAV Systems",
  "Power Solutions",
  "Infrastructure",
  "Electronics",
  "Audio",
  "Accessories",
];

/* ---- Demo data (placeholder) ---- */
export const products: Product[] = [
  {
    id: "AS-900-PR",
    name: "AeroScan Precision Drone",
    brand: "Cento Aerial",
    category: "UAV Systems",
    description: "High-altitude mapping system built for industrial survey work.",
    sku: "AS-900-PR",
    stock: 48,
    status: "In Stock",
    price: 12499,
    discount: 0,
    images: [],
    variants: ["Standard", "Extended Battery"],
    visibility: "public",
    tags: ["NEW ARRIVAL"],
  },
  {
    id: "VP-5000-X",
    name: "Cento Volt-Pack",
    brand: "Cento Power",
    category: "Power Solutions",
    description: "High-capacity energy cell for field deployments.",
    sku: "VP-5000-X",
    stock: 6,
    status: "Low Stock",
    price: 4250,
    discount: 5,
    images: [],
    variants: ["5000mAh", "10000mAh"],
    visibility: "public",
    tags: [],
  },
  {
    id: "ISH-42-GEN3",
    name: "Industrial Sensor Hub",
    brand: "Cento Systems",
    category: "Infrastructure",
    description: "IoT infrastructure gateway for distributed sensor networks.",
    sku: "ISH-42-GEN3",
    stock: 120,
    status: "In Stock",
    price: 1890,
    discount: 0,
    images: [],
    variants: ["Gen 3"],
    visibility: "public",
    tags: ["ECO-FRIENDLY"],
  },
  {
    id: "CS-PRD-00123",
    name: "Premium Leather Ergonomic Chair",
    brand: "Cento Design",
    category: "Furniture & Office",
    description:
      "A premium ergonomic office chair upholstered in full-grain leather, with adjustable lumbar support and a matte-black steel frame.",
    sku: "CS-PRD-00123",
    stock: 100,
    status: "In Stock",
    price: 249,
    discount: 10,
    images: [],
    variants: ["Matte Black", "Carbon Gray", "Arctic White"],
    visibility: "public",
    tags: ["NEW ARRIVAL", "ECO-FRIENDLY"],
  },
  {
    id: "HS-220-AUD",
    name: "Halo Studio Headphones",
    brand: "Cento Audio",
    category: "Audio",
    description: "Closed-back studio monitoring headphones with active noise cancellation.",
    sku: "HS-220-AUD",
    stock: 0,
    status: "Out of Stock",
    price: 219,
    discount: 0,
    images: [],
    variants: ["Black", "Silver"],
    visibility: "public",
    tags: [],
  },
  {
    id: "NB-310-MON",
    name: 'Lumen 27" 4K Monitor',
    brand: "Cento Displays",
    category: "Electronics",
    description: "27-inch 4K IPS display with USB-C power delivery.",
    sku: "NB-310-MON",
    stock: 34,
    status: "In Stock",
    price: 429,
    discount: 0,
    images: [],
    variants: [],
    visibility: "public",
    tags: [],
  },
  {
    id: "PD-014-ACC",
    name: "Pulse Desk Mat — XL",
    brand: "Cento Design",
    category: "Accessories",
    description: "Extra-large stitched-edge desk mat.",
    sku: "PD-014-ACC",
    stock: 18,
    status: "In Stock",
    price: 29,
    discount: 0,
    images: [],
    variants: ["Navy", "Sand"],
    visibility: "private",
    tags: [],
  },
  {
    id: "VX-077-HUB",
    name: "Vortex USB-C Hub",
    brand: "Cento Systems",
    category: "Accessories",
    description: "7-in-1 USB-C hub with HDMI 4K and 100W passthrough.",
    sku: "VX-077-HUB",
    stock: 9,
    status: "Low Stock",
    price: 39,
    discount: 15,
    images: [],
    variants: [],
    visibility: "public",
    tags: [],
  },
  {
    id: "AK-500-KEY",
    name: "Aurora Mechanical Keyboard",
    brand: "Cento Peripherals",
    category: "Electronics",
    description: "Hot-swappable mechanical keyboard with per-key RGB.",
    sku: "AK-500-KEY",
    stock: 62,
    status: "In Stock",
    price: 149,
    discount: 0,
    images: [],
    variants: ["Ivory", "Onyx"],
    visibility: "public",
    tags: ["NEW ARRIVAL"],
  },
  {
    id: "NW-200-MOU",
    name: "Nebula Wireless Mouse",
    brand: "Cento Peripherals",
    category: "Electronics",
    description: "Lightweight wireless mouse with 4000 DPI sensor.",
    sku: "NW-200-MOU",
    stock: 71,
    status: "In Stock",
    price: 59,
    discount: 0,
    images: [],
    variants: [],
    visibility: "public",
    tags: [],
  },
  {
    id: "PS-880-INF",
    name: "Perimeter Sensor Array",
    brand: "Cento Systems",
    category: "Infrastructure",
    description: "Weatherproof perimeter sensing array with mesh networking.",
    sku: "PS-880-INF",
    stock: 4,
    status: "Low Stock",
    price: 3120,
    discount: 0,
    images: [],
    variants: [],
    visibility: "scheduled",
    scheduledDate: "2026-08-01",
    tags: [],
  },
  {
    id: "GB-140-PWR",
    name: "Cento GridBox Inverter",
    brand: "Cento Power",
    category: "Power Solutions",
    description: "Modular grid-tie inverter for solar deployments.",
    sku: "GB-140-PWR",
    stock: 27,
    status: "In Stock",
    price: 1580,
    discount: 8,
    images: [],
    variants: [],
    visibility: "public",
    tags: [],
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function formatCurrency(value: number): string {
  return `€${value.toFixed(2)}`;
}

export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
