export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
export type PaymentStatus = "Paid" | "Pending" | "Refunded" | "Failed";

export type OrderLineItem = {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: string;
  /** Short display date for the list view. */
  date: string;
  /** Long form used in the details modal. */
  placedAt: string;
  customer: {
    name: string;
    initials: string;
    email: string;
    phone: string;
  };
  shipping: {
    method: string;
    tracking: string;
    /** Address rendered one line per entry. */
    address: string[];
  };
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  items: OrderLineItem[];
  shippingCost: number;
  discount: number;
};

export const orderStatuses: OrderStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export const paymentStatuses: PaymentStatus[] = ["Paid", "Pending", "Refunded", "Failed"];

/* ---- Demo data (placeholder) ---- */
export const orders: Order[] = [
  {
    id: "#ORD-2024-8841",
    date: "Oct 24, 2024",
    placedAt: "October 24, 2024 at 2:45 PM",
    customer: {
      name: "Alessandro Lombardi",
      initials: "AL",
      email: "a.lombardi@example.com",
      phone: "+39 012 345 6789",
    },
    shipping: {
      method: "Express Delivery (DHL)",
      tracking: "DHL-99203348120",
      address: ["Alessandro Lombardi", "Via Roma 1, Apt 4B", "20121 Milano (MI)", "Italy"],
    },
    paymentMethod: "Visa •••• 4242",
    paymentStatus: "Paid",
    status: "Shipped",
    items: [
      { name: "Industrial Sensor X-1", sku: "CS-SENS-001", quantity: 1, unitPrice: 890 },
      { name: "Titanium Fastener Kit", sku: "CS-FAST-118", quantity: 3, unitPrice: 45 },
      { name: "Copper Coil Spool", sku: "CS-COIL-560", quantity: 2, unitPrice: 88 },
    ],
    shippingCost: 39,
    discount: 0,
  },
  {
    id: "#ORD-2024-8842",
    date: "Oct 23, 2024",
    placedAt: "October 23, 2024 at 11:12 AM",
    customer: {
      name: "Maria Conti",
      initials: "MC",
      email: "maria.conti@example.com",
      phone: "+39 348 220 1174",
    },
    shipping: {
      method: "Standard Delivery (BRT)",
      tracking: "BRT-55120983311",
      address: ["Maria Conti", "Corso Buenos Aires 22", "20124 Milano (MI)", "Italy"],
    },
    paymentMethod: "PayPal",
    paymentStatus: "Pending",
    status: "Pending",
    items: [
      { name: "Premium Leather Desk Mat", sku: "DM-2023-PL-BLK", quantity: 2, unitPrice: 89 },
      { name: "Aluminum Laptop Stand", sku: "LS-044-ALU-SLV", quantity: 2, unitPrice: 120 },
    ],
    shippingCost: 32.5,
    discount: 0,
  },
  {
    id: "#ORD-2024-8843",
    date: "Oct 23, 2024",
    placedAt: "October 23, 2024 at 9:03 AM",
    customer: {
      name: "Giovanni Rossi",
      initials: "GR",
      email: "g.rossi@example.com",
      phone: "+39 331 908 4420",
    },
    shipping: {
      method: "Freight Delivery (SDA)",
      tracking: "SDA-77410026654",
      address: ["Giovanni Rossi", "Via Torino 118", "10122 Torino (TO)", "Italy"],
    },
    paymentMethod: "Bank Transfer",
    paymentStatus: "Paid",
    status: "Processing",
    items: [
      { name: "Thermal Camera Unit", sku: "CS-THRM-303", quantity: 1, unitPrice: 2100 },
      { name: "Hydraulic Pump Z9", sku: "CS-PUMP-777", quantity: 1, unitPrice: 760 },
      { name: "Precision Bearing Set", sku: "CS-BEAR-204", quantity: 3, unitPrice: 68 },
    ],
    shippingCost: 46,
    discount: 10,
  },
  {
    id: "#ORD-2024-8844",
    date: "Oct 22, 2024",
    placedAt: "October 22, 2024 at 4:31 PM",
    customer: {
      name: "Sofia Fontana",
      initials: "SF",
      email: "sofia.fontana@example.com",
      phone: "+39 366 512 8890",
    },
    shipping: {
      method: "Standard Delivery (Poste)",
      tracking: "PI-42109887760",
      address: ["Sofia Fontana", "Via Garibaldi 9", "50123 Firenze (FI)", "Italy"],
    },
    paymentMethod: "Mastercard •••• 8817",
    paymentStatus: "Paid",
    status: "Delivered",
    items: [{ name: "Premium Leather Desk Mat", sku: "DM-2023-PL-BLK", quantity: 1, unitPrice: 89 }],
    shippingCost: 0,
    discount: 0,
  },
  {
    id: "#ORD-2024-8845",
    date: "Oct 22, 2024",
    placedAt: "October 22, 2024 at 10:05 AM",
    customer: {
      name: "Enzo Moretti",
      initials: "EM",
      email: "enzo.moretti@example.com",
      phone: "+39 380 774 1123",
    },
    shipping: {
      method: "Express Delivery (DHL)",
      tracking: "DHL-11220945567",
      address: ["Enzo Moretti", "Via Napoli 45", "80133 Napoli (NA)", "Italy"],
    },
    paymentMethod: "Visa •••• 1109",
    paymentStatus: "Refunded",
    status: "Cancelled",
    items: [
      { name: "AeroScan Drone Battery", sku: "CS-BATT-050", quantity: 1, unitPrice: 480 },
      { name: "Servo Motor M8", sku: "CS-SERV-810", quantity: 1, unitPrice: 210 },
    ],
    shippingCost: 35,
    discount: 0,
  },
  {
    id: "#ORD-2024-8846",
    date: "Oct 21, 2024",
    placedAt: "October 21, 2024 at 1:20 PM",
    customer: {
      name: "Giulia Ferrari",
      initials: "GF",
      email: "giulia.ferrari@example.com",
      phone: "+39 340 662 3390",
    },
    shipping: {
      method: "Standard Delivery (BRT)",
      tracking: "BRT-90031224587",
      address: ["Giulia Ferrari", "Piazza Duomo 3", "20122 Milano (MI)", "Italy"],
    },
    paymentMethod: "Visa •••• 7731",
    paymentStatus: "Paid",
    status: "Delivered",
    items: [
      { name: "Mechanical Keyboard Case", sku: "KB-75-CS-GRY", quantity: 2, unitPrice: 45 },
      { name: "Premium Leather Desk Mat", sku: "DM-2023-PL-BLK", quantity: 1, unitPrice: 89 },
    ],
    shippingCost: 12,
    discount: 0,
  },
  {
    id: "#ORD-2024-8847",
    date: "Oct 21, 2024",
    placedAt: "October 21, 2024 at 8:47 AM",
    customer: {
      name: "Luca Bianchi",
      initials: "LB",
      email: "luca.bianchi@example.com",
      phone: "+39 349 118 7765",
    },
    shipping: {
      method: "Express Delivery (DHL)",
      tracking: "DHL-33019987123",
      address: ["Luca Bianchi", "Via Dante 77", "16121 Genova (GE)", "Italy"],
    },
    paymentMethod: "PayPal",
    paymentStatus: "Paid",
    status: "Processing",
    items: [{ name: "Aluminum Laptop Stand", sku: "LS-044-ALU-SLV", quantity: 1, unitPrice: 120 }],
    shippingCost: 15,
    discount: 0,
  },
  {
    id: "#ORD-2024-8848",
    date: "Oct 20, 2024",
    placedAt: "October 20, 2024 at 3:58 PM",
    customer: {
      name: "Chiara Esposito",
      initials: "CE",
      email: "c.esposito@example.com",
      phone: "+39 327 445 9902",
    },
    shipping: {
      method: "Standard Delivery (SDA)",
      tracking: "SDA-66200114873",
      address: ["Chiara Esposito", "Via Etnea 210", "95131 Catania (CT)", "Italy"],
    },
    paymentMethod: "Mastercard •••• 2043",
    paymentStatus: "Paid",
    status: "Shipped",
    items: [{ name: "Optical Lens Module", sku: "CS-OPTI-210", quantity: 4, unitPrice: 129 }],
    shippingCost: 24,
    discount: 0,
  },
  {
    id: "#ORD-2024-8849",
    date: "Oct 20, 2024",
    placedAt: "October 20, 2024 at 9:14 AM",
    customer: {
      name: "Matteo Greco",
      initials: "MG",
      email: "matteo.greco@example.com",
      phone: "+39 351 220 6614",
    },
    shipping: {
      method: "Standard Delivery (Poste)",
      tracking: "PI-88123094410",
      address: ["Matteo Greco", "Via Verdi 12", "40121 Bologna (BO)", "Italy"],
    },
    paymentMethod: "Visa •••• 5560",
    paymentStatus: "Failed",
    status: "Pending",
    items: [{ name: "Carbon Valve v4.2", sku: "CS-VALV-992", quantity: 2, unitPrice: 220 }],
    shippingCost: 20,
    discount: 0,
  },
  {
    id: "#ORD-2024-8850",
    date: "Oct 19, 2024",
    placedAt: "October 19, 2024 at 5:22 PM",
    customer: {
      name: "Francesca Marino",
      initials: "FM",
      email: "f.marino@example.com",
      phone: "+39 366 004 8821",
    },
    shipping: {
      method: "Express Delivery (DHL)",
      tracking: "DHL-45590023188",
      address: ["Francesca Marino", "Corso Vittorio 88", "00186 Roma (RM)", "Italy"],
    },
    paymentMethod: "Visa •••• 3390",
    paymentStatus: "Paid",
    status: "Delivered",
    items: [
      { name: "Industrial Valve 15mm-K", sku: "SK-4421", quantity: 1, unitPrice: 340 },
      { name: "Titanium Fastener Kit", sku: "CS-FAST-118", quantity: 2, unitPrice: 45 },
    ],
    shippingCost: 18,
    discount: 25,
  },
  {
    id: "#ORD-2024-8851",
    date: "Oct 19, 2024",
    placedAt: "October 19, 2024 at 11:40 AM",
    customer: {
      name: "Davide Costa",
      initials: "DC",
      email: "davide.costa@example.com",
      phone: "+39 342 887 1200",
    },
    shipping: {
      method: "Standard Delivery (BRT)",
      tracking: "BRT-12009873345",
      address: ["Davide Costa", "Via Mazzini 5", "35121 Padova (PD)", "Italy"],
    },
    paymentMethod: "Bank Transfer",
    paymentStatus: "Refunded",
    status: "Cancelled",
    items: [{ name: "Brass Gear Assembly", sku: "CS-GEAR-441", quantity: 3, unitPrice: 95 }],
    shippingCost: 15,
    discount: 0,
  },
  {
    id: "#ORD-2024-8852",
    date: "Oct 18, 2024",
    placedAt: "October 18, 2024 at 2:08 PM",
    customer: {
      name: "Elena Ricci",
      initials: "ER",
      email: "elena.ricci@example.com",
      phone: "+39 333 190 5567",
    },
    shipping: {
      method: "Freight Delivery (SDA)",
      tracking: "SDA-30948871220",
      address: ["Elena Ricci", "Via Indipendenza 41", "40121 Bologna (BO)", "Italy"],
    },
    paymentMethod: "Bank Transfer",
    paymentStatus: "Paid",
    status: "Shipped",
    items: [{ name: "Hydraulic Pump Z9", sku: "CS-PUMP-777", quantity: 2, unitPrice: 760 }],
    shippingCost: 40,
    discount: 60,
  },
];

export type OrderTotals = {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
};

export function orderTotals(order: Order): OrderTotals {
  const subtotal = order.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  return {
    subtotal,
    shipping: order.shippingCost,
    discount: order.discount,
    total: subtotal + order.shippingCost - order.discount,
  };
}

export { formatEuro } from "@/lib/admin/format";
