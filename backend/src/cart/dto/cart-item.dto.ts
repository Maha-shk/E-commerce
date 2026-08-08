import { IsInt, IsNumber, IsOptional, IsString, Min, IsDecimal } from 'class-validator';

export class CreateCartItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  /**
   * Which `ProductVariant` the shopper selected.
   *
   * Required whenever the product defines variants — enforced in the service,
   * not here, because the rule depends on the product being added. Products
   * with no variants must omit it.
   */
  @IsOptional()
  @IsString()
  variantId?: string;

  /** @deprecated Superseded by `variantId`. Accepted so older clients keep working. */
  @IsOptional()
  @IsString()
  color?: string;

  /** @deprecated Superseded by `variantId`. */
  @IsOptional()
  @IsString()
  size?: string;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CartItemResponseDto {
  id: string;
  productId: string;
  name: string;
  brand: string;
  sku: string;
  price: number;
  discount: number;
  salePrice: number;
  image: string | null;
  quantity: number;
  unitPrice: number;
  /** Selected variant, when the product has any. */
  variantId?: string;
  variantName?: string;
  /** Every variant the product offers, so the cart can render a switcher. */
  availableVariants?: { id: string; name: string }[];
  color?: string;
  size?: string;
  inStock: boolean;
  lowStock: boolean;
  stock: number;
}

export class CartResponseDto {
  id: string;
  items: CartItemResponseDto[];
  totalItems: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}
