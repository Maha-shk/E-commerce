import { IsString, IsOptional, IsNumber } from 'class-validator';

export class AddToWishlistDto {
  @IsString()
  productId: string;
}

export class CategoryDto {
  id: string;
  name: string;
  slug: string;
}

export class WishlistItemResponseDto {
  id: string;
  productId: string;
  name: string;
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
  category: CategoryDto | null;
}