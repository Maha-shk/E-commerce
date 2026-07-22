import { StockStatus } from '@prisma/client';

/** At or below this level (but above zero) a product counts as "Low Stock". */
export const LOW_STOCK_THRESHOLD = 20;

/** Stock status is always derived from the quantity, never set by hand. */
export function deriveStockStatus(stock: number): StockStatus {
  if (stock <= 0) return StockStatus.OUT_OF_STOCK;
  if (stock <= LOW_STOCK_THRESHOLD) return StockStatus.LOW_STOCK;
  return StockStatus.IN_STOCK;
}

/** Converts a name into a URL-safe slug (mirrors the frontend's slugify). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
