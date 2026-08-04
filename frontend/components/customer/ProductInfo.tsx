"use client";

import { useState } from "react";
import { Heart, ShoppingCart, Package, Shield, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  sku: string;
  price: number;
  salePrice: number;
  discountPercent: number;
  stock: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  tags: string[];
  images: Array<{ id: string; url: string; position: number }>;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  inStock: boolean;
  lowStock: boolean;
}

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Mock color and size options based on product data
  const colorOptions = ["Black", "Brown", "Blue"];
  const sizeOptions = ["38mm", "42mm", "44mm"];

  const hasDiscount = product.discountPercent > 0;
  const displayPrice = hasDiscount ? product.salePrice : product.price;

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log("Adding to cart:", {
      productId: product.id,
      quantity,
      color: selectedColor,
      size: selectedSize,
    });
  };

  const handleToggleWishlist = () => {
    // TODO: Implement wishlist functionality
    setIsWishlisted(!isWishlisted);
    console.log("Wishlist toggled for:", product.id);
  };

  const isOutOfStock = !product.inStock || product.stock === 0;

  return (
    <div className="space-y-6">
      {/* Collection Label */}
      {product.category && (
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          {product.category.name}
        </p>
      )}

      {/* Product Name */}
      <h1 className="font-display text-3xl font-bold text-foreground lg:text-4xl">
        {product.name}
      </h1>

      {/* Brand */}
      <p className="text-sm text-muted-foreground">{product.brand}</p>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="font-display text-3xl font-bold text-foreground">
          €{displayPrice.toFixed(2)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-lg text-muted-foreground line-through">
              €{product.price.toFixed(2)}
            </span>
            <Badge className="bg-orange-500 text-white text-xs hover:bg-orange-600">
              {product.discountPercent}% OFF
            </Badge>
          </>
        )}
      </div>

      {/* Stock Status */}
      <div>
        {isOutOfStock ? (
          <Badge variant="destructive">Out of Stock</Badge>
        ) : product.lowStock ? (
          <Badge className="bg-red-500 text-white hover:bg-red-600">Low Stock - Only {product.stock} left</Badge>
        ) : (
          <Badge variant="success">In Stock</Badge>
        )}
      </div>

      {/* Color Options */}
      {colorOptions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Color</p>
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  "rounded-lg border-2 px-6 py-2 text-sm font-medium transition-colors",
                  selectedColor === color
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary"
                )}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Options */}
      {sizeOptions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Size</p>
          <div className="flex flex-wrap gap-3">
            {sizeOptions.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "rounded-lg border-2 px-6 py-2 text-sm font-medium transition-colors",
                  selectedSize === size
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Quantity</p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
            disabled={quantity <= 1}
            className="flex size-10 items-center justify-center rounded-lg border-2 border-input bg-background text-foreground transition-colors hover:border-primary disabled:opacity-50"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="min-w-12 text-center font-semibold tabular-nums">{quantity}</span>
          <button
            onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
            disabled={quantity >= product.stock}
            className="flex size-10 items-center justify-center rounded-lg border-2 border-input bg-background text-foreground transition-colors hover:border-primary disabled:opacity-50"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="xl"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-1"
        >
          <ShoppingCart className="mr-2 size-5" />
          Add to Cart
        </Button>
        <Button
          variant="outline"
          size="xl"
          onClick={handleToggleWishlist}
          className={cn(
            "flex-1",
            isWishlisted && "border-destructive text-destructive hover:bg-destructive/10"
          )}
        >
          <Heart className={cn("mr-2 size-5", isWishlisted && "fill-current")} />
          {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
        </Button>
      </div>

      {/* Additional Info */}
      <div className="space-y-3 border-t pt-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Package className="size-5 text-primary" />
          <span>Free Personalization</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Shield className="size-5 text-primary" />
          <span>3 Year Warranty</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Box className="size-5 text-primary" />
          <span>Complete with Box</span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2 border-t pt-6">
        <h3 className="text-sm font-semibold text-foreground">Description</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <div className="space-y-2 border-t pt-6">
          <h3 className="text-sm font-semibold text-foreground">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
