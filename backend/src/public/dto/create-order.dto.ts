import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OrderContactDto {
  @ApiProperty()
  @IsEmail({}, { message: 'A valid email address is required' })
  @MaxLength(255)
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @MaxLength(40)
  phone!: string;
}

export class OrderAddressDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) firstName!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) lastName!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) address!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) apartment?: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) city!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) state?: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(30) postalCode!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) country!: string;
}

/**
 * A requested line. Only `productId` and `quantity` are trusted — everything
 * else the client sends about a product (name, price, salePrice, image) is
 * ignored and re-read from the database when the order is priced.
 *
 * Those display fields are still declared because the global ValidationPipe
 * runs with `forbidNonWhitelisted: true`: undeclared properties are a 400, not
 * a silent strip. Declaring them keeps the existing checkout payload valid
 * while the service ignores their values entirely.
 */
export class OrderItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'productId is required for every item' })
  productId!: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Quantity must be a whole number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity!: number;

  /**
   * Chosen `ProductVariant`. Required when the product defines variants —
   * validated against the product record, the same rule the cart enforces.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantId?: string;

  /* ---- Accepted for backwards compatibility, never read ---- */

  @ApiPropertyOptional({ description: 'Ignored — the name is read from the product record' })
  @IsOptional()
  name?: unknown;

  @ApiPropertyOptional({ description: 'Ignored — pricing is server-side' })
  @IsOptional()
  price?: unknown;

  @ApiPropertyOptional({ description: 'Ignored — pricing is server-side' })
  @IsOptional()
  salePrice?: unknown;

  @ApiPropertyOptional({ description: 'Ignored — the image is read from the product record' })
  @IsOptional()
  image?: unknown;
}

export class CreatePublicOrderDto {
  @ApiProperty({ type: OrderContactDto })
  @ValidateNested()
  @Type(() => OrderContactDto)
  contactInfo!: OrderContactDto;

  @ApiProperty({ type: OrderAddressDto })
  @ValidateNested()
  @Type(() => OrderAddressDto)
  shippingAddress!: OrderAddressDto;

  @ApiPropertyOptional({ enum: ['standard', 'express'] })
  @IsOptional()
  @IsIn(['standard', 'express'], {
    message: 'deliveryMethod must be "standard" or "express"',
  })
  deliveryMethod?: 'standard' | 'express';

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must contain at least one item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  /* ---- Client-computed money: accepted, logged if wrong, never trusted ----
   *
   * The browser still posts these. They are declared only so the request
   * validates (see the note on OrderItemDto); the service recomputes every
   * figure from the database. Anyone could otherwise POST a total of 0.01.
   */

  @ApiPropertyOptional({ description: 'Ignored — recomputed server-side' })
  @IsOptional()
  subtotal?: unknown;

  @ApiPropertyOptional({ description: 'Ignored — recomputed server-side' })
  @IsOptional()
  shippingCost?: unknown;

  @ApiPropertyOptional({ description: 'Ignored — recomputed server-side' })
  @IsOptional()
  total?: unknown;

  /**
   * Set by the checkout when the shopper is signed in. Treated as a hint only:
   * the order is attached by verified email, never by a client-supplied id.
   */
  @ApiPropertyOptional({ description: 'Ignored — the customer is resolved by email' })
  @IsOptional()
  userId?: unknown;
}
