import { createElement, type ReactElement } from "react";
import {
  Baby,
  Bike,
  Book,
  Camera,
  Car,
  Cpu,
  Drill,
  Dumbbell,
  Flower2,
  Gamepad2,
  Hammer,
  Headphones,
  HeartPulse,
  House,
  Laptop,
  Monitor,
  Package,
  PawPrint,
  Plug,
  Printer,
  Refrigerator,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Utensils,
  Watch,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Icon keys a Category may carry.
 *
 * `Category.icon` holds a lucide key rather than a URL — it's what a tile or a
 * nav row falls back to when there is no artwork. Category-only by design: the
 * other three levels use real logos, not glyphs.
 *
 * The stored value is the lucide component name, so adding an option here is
 * the only step needed to offer it.
 */
export const CATALOG_ICONS: Record<string, LucideIcon> = {
  Package,
  Shirt,
  Smartphone,
  Laptop,
  Monitor,
  Cpu,
  Printer,
  Headphones,
  Camera,
  Gamepad2,
  Watch,
  House,
  Sofa,
  Refrigerator,
  Utensils,
  Flower2,
  HeartPulse,
  Dumbbell,
  Bike,
  Baby,
  Book,
  Car,
  Wrench,
  Hammer,
  Drill,
  Plug,
  PawPrint,
  ShoppingBasket,
};

export const CATALOG_ICON_KEYS = Object.keys(CATALOG_ICONS);

/**
 * Renders the glyph for a stored key, falling back when the key is absent or
 * no longer maps to anything.
 *
 * Returns an element rather than a component on purpose. Picking a component
 * into a capitalised local during render is what `react-hooks/static-components`
 * flags — it can't tell a lookup of an existing component from a freshly
 * defined one, and the latter would remount on every render.
 */
export function catalogGlyph(
  key: string | null | undefined,
  fallback: LucideIcon,
  className = "size-5",
): ReactElement {
  const component = (key ? CATALOG_ICONS[key] : undefined) ?? fallback;
  return createElement(component, { className, "aria-hidden": true });
}
