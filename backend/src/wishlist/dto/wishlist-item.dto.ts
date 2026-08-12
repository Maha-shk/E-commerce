import { IsString, IsOptional, IsNumber } from 'class-validator';

export class AddToWishlistDto {
  @IsString()
  productId: string;
}

export class CatalogRefDto {
  id: string;
  name: string;
  slug: string;
}

export class WishlistItemResponseDto {
  id: string;
  productId: string;
  name: string;
  /** Company name — what the removed `Product.brand` column used to hold. */
  brand: string;
  sku: string;
  price: number;
  discount: number;
  salePrice: number;
  image: string | null;
  inStock: boolean;
  lowStock: boolean;
  stock: number;
  addedAt: string;
  category: CatalogRefDto | null;
  model: CatalogRefDto | null;
}