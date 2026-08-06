import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ description: 'Filter by customer id' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Orders placed on/after this date (ISO)' })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'Orders placed on/before this date (ISO)' })
  @IsDateString()
  @IsOptional()
  to?: string;
}

export class OrderItemDto {
  @ApiPropertyOptional({ description: 'Links the line to a catalog product' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  sku!: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice!: number;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'Existing customer id' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'An order needs at least one line item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({ example: 'Visa •••• 4242' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'Express Delivery (DHL)' })
  @IsString()
  @IsOptional()
  shippingMethod?: string;

  @ApiPropertyOptional({ example: 'DHL-99203348120' })
  @IsString()
  @IsOptional()
  shippingTracking?: string;

  @ApiPropertyOptional({ type: [String], description: 'One line per array entry' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  shippingAddress?: string[];

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  shippingCost?: number;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  discount?: number;
}

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  shippingTracking?: string;
}
