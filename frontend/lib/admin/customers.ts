export type CustomerStatus = "Active" | "Inactive";
export type CustomerOrderStatus =
  | "Delivered"
  | "Processing"
  | "Shipped"
  | "Returned"
  | "Cancelled";

export type CustomerOrder = {
  id: string;
  date: string;
  total: number;
  status: CustomerOrderStatus;
};

export type Customer = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  /** Short form for the list view. */
  joinDate: string;
  /** Long form for the details modal. */
  joinedAt: string;
  totalOrders: number;
  totalSpent: number;
  /** Default shipping address, one line per entry. */
  address: string[];
  recentOrders: CustomerOrder[];
};

export const customerStatuses: CustomerStatus[] = ["Active", "Inactive"];

/* ---- Demo data (placeholder) ---- */
export const customers: Customer[] = [
  {
    id: "CUS-1001",
    name: "Elena Bianchi",
    initials: "EB",
    email: "elena.bianchi@example.com",
    phone: "+39 333 481 2290",
    status: "Active",
    joinDate: "Mar 08, 2021",
    joinedAt: "March 8, 2021",
    totalOrders: 24,
    totalSpent: 12450,
    address: ["Elena Bianchi", "Via della Spiga, 12", "20121 Milano (MI)", "Italy"],
    recentOrders: [
      { id: "#ORD-2024-8841", date: "Oct 24, 2024", total: 1240, status: "Delivered" },
      { id: "#ORD-2024-8712", date: "Sep 12, 2024", total: 640.5, status: "Delivered" },
      { id: "#ORD-2024-8590", date: "Aug 05, 2024", total: 289, status: "Returned" },
      { id: "#ORD-2024-8402", date: "Jul 18, 2024", total: 1875, status: "Delivered" },
    ],
  },
  {
    id: "CUS-1002",
    name: "Marco Rossi",
    initials: "MR",
    email: "m.rossi@service.it",
    phone: "+39 348 110 7734",
    status: "Active",
    joinDate: "Nov 22, 2021",
    joinedAt: "November 22, 2021",
    totalOrders: 12,
    totalSpent: 8200.5,
    address: ["Marco Rossi", "Corso Buenos Aires, 45", "20124 Milano (MI)", "Italy"],
    recentOrders: [
      { id: "#ORD-2024-8801", date: "Oct 12, 2024", total: 2100, status: "Delivered" },
      { id: "#ORD-2024-8655", date: "Aug 30, 2024", total: 980.5, status: "Shipped" },
      { id: "#ORD-2024-8511", date: "Jun 14, 2024", total: 1320, status: "Delivered" },
    ],
  },
  {
    id: "CUS-1003",
    name: "Sofia Conti",
    initials: "SC",
    email: "s.conti@design.com",
    phone: "+39 366 902 5514",
    status: "Inactive",
    joinDate: "Feb 03, 2024",
    joinedAt: "February 3, 2024",
    totalOrders: 0,
    totalSpent: 0,
    address: ["Sofia Conti", "Via Garibaldi, 9", "50123 Firenze (FI)", "Italy"],
    recentOrders: [],
  },
  {
    id: "CUS-1004",
    name: "Luca Moretti",
    initials: "LM",
    email: "l.moretti@tech.io",
    phone: "+39 349 220 8891",
    status: "Active",
    joinDate: "Jun 17, 2020",
    joinedAt: "June 17, 2020",
    totalOrders: 45,
    totalSpent: 32900,
    address: ["Luca Moretti", "Via Dante, 77", "16121 Genova (GE)", "Italy"],
    recentOrders: [
      { id: "#ORD-2024-8847", date: "Oct 21, 2024", total: 135, status: "Processing" },
      { id: "#ORD-2024-8790", date: "Oct 02, 2024", total: 4260, status: "Delivered" },
      { id: "#ORD-2024-8688", date: "Sep 09, 2024", total: 2890, status: "Delivered" },
      { id: "#ORD-2024-8534", date: "Jul 25, 2024", total: 760, status: "Cancelled" },
    ],
  },
  {
    id: "CUS-1005",
    name: "Giulia Ricci",
    initials: "GR",
    email: "giulia.ricci@corp.it",
    phone: "+39 331 774 0126",
    status: "Active",
    joinDate: "Sep 29, 2022",
    joinedAt: "September 29, 2022",
    totalOrders: 8,
    totalSpent: 2150,
    address: ["Giulia Ricci", "Piazza Duomo, 3", "20122 Milano (MI)", "Italy"],
    recentOrders: [
      { id: "#ORD-2024-8846", date: "Oct 21, 2024", total: 191, status: "Delivered" },
      { id: "#ORD-2024-8620", date: "Aug 18, 2024", total: 545, status: "Delivered" },
    ],
  },
  {
    id: "CUS-1006",
    name: "Alessandro Moretti",
    initials: "AM",
    email: "aless.m@example.com",
    phone: "+39 333 123 4567",
    status: "Active",
    joinDate: "Jan 14, 2022",
    joinedAt: "January 14, 2022",
    totalOrders: 42,
    totalSpent: 18600,
    address: ["Alessandro Moretti", "Via della Spiga, 12", "20121 Milano (MI)", "Italy"],
    recentOrders: [
      { id: "#ORD-2024-8833", date: "Oct 24, 2024", total: 1490, status: "Delivered" },
      { id: "#ORD-2024-8701", date: "Sep 12, 2024", total: 320, status: "Delivered" },
      { id: "#ORD-2024-8577", date: "Aug 05, 2024", total: 875, status: "Returned" },
      { id: "#ORD-2024-8390", date: "Jul 18, 2024", total: 2240, status: "Delivered" },
    ],
  },
  {
    id: "CUS-1007",
    name: "Chiara Esposito",
    initials: "CE",
    email: "c.esposito@example.com",
    phone: "+39 327 445 9902",
    status: "Active",
    joinDate: "Apr 11, 2023",
    joinedAt: "April 11, 2023",
    totalOrders: 17,
    totalSpent: 6480,
    address: ["Chiara Esposito", "Via Etnea, 210", "95131 Catania (CT)", "Italy"],
    recentOrders: [
      { id: "#ORD-2024-8848", date: "Oct 20, 2024", total: 540, status: "Shipped" },
      { id: "#ORD-2024-8644", date: "Sep 01, 2024", total: 1260, status: "Delivered" },
    ],
  },
  {
    id: "CUS-1008",
    name: "Matteo Greco",
    initials: "MG",
    email: "matteo.greco@example.com",
    phone: "+39 351 220 6614",
    status: "Inactive",
    joinDate: "Oct 30, 2023",
    joinedAt: "October 30, 2023",
    totalOrders: 3,
    totalSpent: 940,
    address: ["Matteo Greco", "Via Verdi, 12", "40121 Bologna (BO)", "Italy"],
    recentOrders: [
      { id: "#ORD-2024-8849", date: "Oct 20, 2024", total: 460, status: "Cancelled" },
      { id: "#ORD-2024-8120", date: "Apr 06, 2024", total: 480, status: "Delivered" },
    ],
  },
  {
    id: "CUS-1009",
    name: "Francesca Marino",
    initials: "FM",
    email: "f.marino@example.com",
    phone: "+39 366 004 8821",
    status: "Active",
    joinDate: "Jul 05, 2021",
    joinedAt: "July 5, 2021",
    totalOrders: 31,
    totalSpent: 15720,
    address: ["Francesca Marino", "Corso Vittorio, 88", "00186 Roma (RM)", "Italy"],
    recentOrders: [
      { id: "#ORD-2024-8850", date: "Oct 19, 2024", total: 423, status: "Delivered" },
      { id: "#ORD-2024-8733", date: "Sep 22, 2024", total: 2310, status: "Delivered" },
      { id: "#ORD-2024-8601", date: "Aug 11, 2024", total: 1180, status: "Shipped" },
    ],
  },
  {
    id: "CUS-1010",
    name: "Davide Costa",
    initials: "DC",
    email: "davide.costa@example.com",
    phone: "+39 342 887 1200",
    status: "Inactive",
    joinDate: "Dec 19, 2022",
    joinedAt: "December 19, 2022",
    totalOrders: 5,
    totalSpent: 1310,
    address: ["Davide Costa", "Via Mazzini, 5", "35121 Padova (PD)", "Italy"],
    recentOrders: [
      { id: "#ORD-2024-8851", date: "Oct 19, 2024", total: 300, status: "Cancelled" },
      { id: "#ORD-2024-8244", date: "May 27, 2024", total: 610, status: "Delivered" },
    ],
  },
  {
    id: "CUS-1011",
    name: "Valentina Russo",
    initials: "VR",
    email: "v.russo@studio.it",
    phone: "+39 340 559 3378",
    status: "Active",
    joinDate: "Feb 26, 2023",
    joinedAt: "February 26, 2023",
    totalOrders: 19,
    totalSpent: 9840,
    address: ["Valentina Russo", "Via Indipendenza, 41", "40121 Bologna (BO)", "Italy"],
    recentOrders: [
      { id: "#ORD-2024-8812", date: "Oct 14, 2024", total: 1680, status: "Delivered" },
      { id: "#ORD-2024-8709", date: "Sep 15, 2024", total: 730, status: "Delivered" },
    ],
  },
  {
    id: "CUS-1012",
    name: "Antonio Bruno",
    initials: "AB",
    email: "antonio.bruno@example.com",
    phone: "+39 328 661 4407",
    status: "Active",
    joinDate: "May 09, 2024",
    joinedAt: "May 9, 2024",
    totalOrders: 6,
    totalSpent: 3275,
    address: ["Antonio Bruno", "Via Napoli, 45", "80133 Napoli (NA)", "Italy"],
    recentOrders: [
      { id: "#ORD-2024-8778", date: "Oct 08, 2024", total: 1420, status: "Delivered" },
      { id: "#ORD-2024-8666", date: "Sep 03, 2024", total: 855, status: "Processing" },
    ],
  },
];

/** Average value per order, guarding against customers with no orders. */
export function averageOrderValue(customer: Customer): number {
  if (customer.totalOrders === 0) return 0;
  return customer.totalSpent / customer.totalOrders;
}
