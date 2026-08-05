import { IsInt, IsNumber, IsOptional, IsString, Min, IsDecimal } from 'class-validator';

export class CreateCartItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  color?: string;

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
