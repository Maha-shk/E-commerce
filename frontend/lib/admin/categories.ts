export type CategoryStatus = "active" | "archived";
export type CategoryVisibility = "visible" | "hidden";

/** Icon keys mapped to lucide icons in the UI layer (keeps this file server-safe). */
export type CategoryIconKey =
  | "fashion"
  | "electronics"
  | "home"
  | "health"
  | "sports"
  | "toys"
  | "books"
  | "automotive"
  | "grocery"
  | "pets";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: CategoryIconKey;
  subcategories: number;
  products: number;
  status: CategoryStatus;
  visibility: CategoryVisibility;
  thumbnail?: { name: string; size: string };
};

/* ---- Demo data (placeholder) ---- */
export const categories: Category[] = [
  {
    id: "CAT-001",
    name: "Fashion & Apparel",
    slug: "fashion-apparel",
    description: "Premium seasonal clothing, footwear, and denim collections.",
    icon: "fashion",
    subcategories: 12,
    products: 1240,
    status: "active",
    visibility: "visible",
    thumbnail: { name: "hero-banner.jpg", size: "1.2 MB" },
  },
  {
    id: "CAT-002",
    name: "Electronics",
    slug: "electronics",
    description: "Latest smartphones, laptops, and home automation devices.",
    icon: "electronics",
    subcategories: 8,
    products: 850,
    status: "active",
    visibility: "visible",
  },
  {
    id: "CAT-003",
    name: "Home & Decor",
    slug: "home-decor",
    description: "Modern furniture, sustainable decor, and kitchenware.",
    icon: "home",
    subcategories: 15,
    products: 2105,
    status: "active",
    visibility: "visible",
  },
  {
    id: "CAT-004",
    name: "Health & Beauty",
    slug: "health-beauty",
    description: "Skincare, fitness equipment, supplements, and wellness.",
    icon: "health",
    subcategories: 6,
    products: 627,
    status: "active",
    visibility: "visible",
  },
  {
    id: "CAT-005",
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    description: "Gear for hiking, cycling, and competitive team sports.",
    icon: "sports",
    subcategories: 9,
    products: 540,
    status: "active",
    visibility: "visible",
  },
  {
    id: "CAT-006",
    name: "Toys & Games",
    slug: "toys-games",
    description: "Educational toys, board games, and rare collectibles.",
    icon: "toys",
    subcategories: 5,
    products: 312,
    status: "active",
    visibility: "visible",
  },
  {
    id: "CAT-007",
    name: "Books & Media",
    slug: "books-media",
    description: "Bestsellers, audiobooks, and digital streaming media.",
    icon: "books",
    subcategories: 4,
    products: 198,
    status: "archived",
    visibility: "hidden",
  },
  {
    id: "CAT-008",
    name: "Automotive",
    slug: "automotive",
    description: "Parts, accessories, and everyday car care essentials.",
    icon: "automotive",
    subcategories: 7,
    products: 421,
    status: "active",
    visibility: "visible",
  },
  {
    id: "CAT-009",
    name: "Grocery & Gourmet",
    slug: "grocery-gourmet",
    description: "Artisan foods, specialty beverages, and pantry staples.",
    icon: "grocery",
    subcategories: 3,
    products: 0,
    status: "active",
    visibility: "hidden",
  },
  {
    id: "CAT-010",
    name: "Pet Supplies",
    slug: "pet-supplies",
    description: "Food, toys, and grooming essentials for every pet.",
    icon: "pets",
    subcategories: 2,
    products: 0,
    status: "archived",
    visibility: "hidden",
  },
];

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

/** Converts a category name into a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
