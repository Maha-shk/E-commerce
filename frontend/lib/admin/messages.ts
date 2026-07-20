import { formatEuro } from "./format";

export { formatEuro };

export type PresenceStatus = "online" | "offline";
export type MessageDirection = "incoming" | "outgoing";

export type ChatMessage = {
  id: string;
  direction: MessageDirection;
  text: string;
  time: string;
};

export type ConversationOrderStatus = "Delivered" | "Processing" | "Shipped" | "Cancelled";

export type ConversationOrder = {
  id: string;
  date: string;
  amount: number;
  status: ConversationOrderStatus;
};

export type Conversation = {
  id: string;
  customer: {
    name: string;
    initials: string;
    email: string;
    phone: string;
  };
  presence: PresenceStatus;
  /** Preview shown in the conversation list. */
  lastMessage: string;
  /** Relative timestamp for the list row. */
  time: string;
  unread: number;
  totalOrders: number;
  totalSpent: number;
  customerSince: string;
  accountStatus: "Active" | "VIP" | "New";
  recentOrders: ConversationOrder[];
  messages: ChatMessage[];
};

export const conversationOrderStatusVariant: Record<
  ConversationOrderStatus,
  "success" | "info" | "navy" | "destructive"
> = {
  Delivered: "success",
  Processing: "info",
  Shipped: "navy",
  Cancelled: "destructive",
};

/* ---- Demo data (placeholder) ---- */
export const conversations: Conversation[] = [
  {
    id: "CNV-01",
    customer: {
      name: "Elena Bianchi",
      initials: "EB",
      email: "elena.bianchi@example.com",
      phone: "+39 333 481 2290",
    },
    presence: "online",
    lastMessage: "Perfect, thank you! When can I expect the delivery?",
    time: "2m",
    unread: 2,
    totalOrders: 24,
    totalSpent: 12450,
    customerSince: "March 2021",
    accountStatus: "VIP",
    recentOrders: [
      { id: "#ORD-8841", date: "Oct 24, 2024", amount: 1240, status: "Delivered" },
      { id: "#ORD-8712", date: "Sep 12, 2024", amount: 640.5, status: "Delivered" },
      { id: "#ORD-8590", date: "Aug 05, 2024", amount: 289, status: "Cancelled" },
    ],
    messages: [
      { id: "m1", direction: "incoming", text: "Hi! I placed an order yesterday but haven't received a confirmation email.", time: "09:41" },
      { id: "m2", direction: "outgoing", text: "Hello Elena! Let me check that for you right away.", time: "09:42" },
      { id: "m3", direction: "outgoing", text: "I can see order #ORD-8841 was confirmed — the email may have gone to spam.", time: "09:43" },
      { id: "m4", direction: "incoming", text: "Found it, thanks! It was indeed in spam.", time: "09:45" },
      { id: "m5", direction: "incoming", text: "Perfect, thank you! When can I expect the delivery?", time: "09:46" },
    ],
  },
  {
    id: "CNV-02",
    customer: {
      name: "Marco Rossi",
      initials: "MR",
      email: "m.rossi@service.it",
      phone: "+39 348 110 7734",
    },
    presence: "online",
    lastMessage: "Could you help me change the shipping address?",
    time: "18m",
    unread: 1,
    totalOrders: 12,
    totalSpent: 8200.5,
    customerSince: "November 2021",
    accountStatus: "Active",
    recentOrders: [
      { id: "#ORD-8801", date: "Oct 12, 2024", amount: 2100, status: "Delivered" },
      { id: "#ORD-8655", date: "Aug 30, 2024", amount: 980.5, status: "Shipped" },
    ],
    messages: [
      { id: "m1", direction: "incoming", text: "Good morning, I need to update the delivery address for my latest order.", time: "08:20" },
      { id: "m2", direction: "outgoing", text: "Of course, Marco. Which order is it?", time: "08:22" },
      { id: "m3", direction: "incoming", text: "Could you help me change the shipping address?", time: "08:23" },
    ],
  },
  {
    id: "CNV-03",
    customer: {
      name: "Sofia Conti",
      initials: "SC",
      email: "s.conti@design.com",
      phone: "+39 366 902 5514",
    },
    presence: "offline",
    lastMessage: "Great, the refund has been processed. Thanks for your patience.",
    time: "1h",
    unread: 0,
    totalOrders: 6,
    totalSpent: 2150,
    customerSince: "February 2024",
    accountStatus: "New",
    recentOrders: [
      { id: "#ORD-8846", date: "Oct 21, 2024", amount: 191, status: "Delivered" },
      { id: "#ORD-8620", date: "Aug 18, 2024", amount: 545, status: "Cancelled" },
    ],
    messages: [
      { id: "m1", direction: "incoming", text: "Hello, I'd like to request a refund for a returned item.", time: "Yesterday" },
      { id: "m2", direction: "outgoing", text: "I've started the refund process for you.", time: "Yesterday" },
      { id: "m3", direction: "outgoing", text: "Great, the refund has been processed. Thanks for your patience.", time: "Yesterday" },
    ],
  },
  {
    id: "CNV-04",
    customer: {
      name: "Luca Moretti",
      initials: "LM",
      email: "l.moretti@tech.io",
      phone: "+39 349 220 8891",
    },
    presence: "offline",
    lastMessage: "Do you offer bulk discounts for corporate accounts?",
    time: "3h",
    unread: 0,
    totalOrders: 45,
    totalSpent: 32900,
    customerSince: "June 2020",
    accountStatus: "VIP",
    recentOrders: [
      { id: "#ORD-8847", date: "Oct 21, 2024", amount: 135, status: "Processing" },
      { id: "#ORD-8790", date: "Oct 02, 2024", amount: 4260, status: "Delivered" },
    ],
    messages: [
      { id: "m1", direction: "incoming", text: "Hi, I manage procurement for a small studio.", time: "06:10" },
      { id: "m2", direction: "incoming", text: "Do you offer bulk discounts for corporate accounts?", time: "06:11" },
    ],
  },
  {
    id: "CNV-05",
    customer: {
      name: "Giulia Ricci",
      initials: "GR",
      email: "giulia.ricci@corp.it",
      phone: "+39 331 774 0126",
    },
    presence: "offline",
    lastMessage: "Thank you for the quick support!",
    time: "1d",
    unread: 0,
    totalOrders: 8,
    totalSpent: 2150,
    customerSince: "September 2022",
    accountStatus: "Active",
    recentOrders: [{ id: "#ORD-8846", date: "Oct 21, 2024", amount: 191, status: "Delivered" }],
    messages: [
      { id: "m1", direction: "incoming", text: "The issue with my account is resolved now.", time: "Mon" },
      { id: "m2", direction: "outgoing", text: "Glad to hear it! Let us know if anything else comes up.", time: "Mon" },
      { id: "m3", direction: "incoming", text: "Thank you for the quick support!", time: "Mon" },
    ],
  },
];
