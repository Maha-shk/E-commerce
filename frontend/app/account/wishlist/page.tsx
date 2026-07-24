import { Package, Heart, Star, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ---- Demo data (placeholder) ---- */
const wishlist = [
  { name: "Aurora Mechanical Keyboard", category: "Peripherals", price: "$149.00", rating: 5, inStock: true },
  { name: 'Lumen 27" 4K Monitor', category: "Displays", price: "$429.00", rating: 4, inStock: true },
  { name: "Nebula Wireless Mouse", category: "Peripherals", price: "$59.00", rating: 5, inStock: true },
  { name: "Vortex USB-C Hub", category: "Accessories", price: "$39.00", rating: 4, inStock: false },
  { name: "Halo Studio Headphones", category: "Audio", price: "$219.00", rating: 5, inStock: true },
  { name: "Pulse Desk Mat — XL", category: "Accessories", price: "$29.00", rating: 4, inStock: true },
];

export default function WishlistPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Wishlist"
        subtitle="Products you've saved for later."
        action={
          <Button size="xl">
            <ShoppingCart />
            Add all to cart
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {wishlist.map((product) => (
          <Card key={product.name} className="gap-0 pt-0">
            {/* Image placeholder */}
            <div className="relative flex aspect-4/3 items-center justify-center bg-linear-to-br from-accent via-muted to-background">
              <Package className="size-12 text-primary/20" />
              <Button
                variant="outline"
                size="icon"
                aria-label="Remove from wishlist"
                className="absolute right-3 top-3 size-9 rounded-full bg-card/90 text-destructive backdrop-blur hover:text-destructive"
              >
                <Heart className="size-4 fill-current" />
              </Button>
              {!product.inStock && (
                <Badge variant="secondary" className="absolute left-3 top-3">
                  Out of stock
                </Badge>
              )}
            </div>

            {/* Details */}
            <div className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-subtle">
                {product.category}
              </p>
              <h3 className="mt-1 truncate font-display text-base font-semibold text-foreground">
                {product.name}
              </h3>

              <div className="mt-1.5 flex items-center gap-1 text-warning">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn("size-3.5", i < product.rating ? "fill-current" : "text-muted")}
                  />
                ))}
                <span className="ml-1 text-xs text-subtle">({product.rating}.0)</span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="font-display text-lg font-semibold text-foreground">{product.price}</p>
                <Button variant={product.inStock ? "default" : "outline"} size="sm" disabled={!product.inStock}>
                  <ShoppingCart />
                  {product.inStock ? "Add to cart" : "Notify me"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
