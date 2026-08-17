import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ToBoolean } from '../../common/dto/transformers';

export class SubscribeStockNotificationDto {
  @ApiProperty({
    example: 'shopper@example.com',
    description:
      'Where to write when the product returns. Optional for a signed-in ' +
      'shopper, whose account address is used instead.',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class StockNotificationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Only requests for this product' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({
    description:
      'Default true — only people still waiting. Pass false to include ' +
      'requests already notified.',
    default: true,
  })
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  waitingOnly?: boolean = true;
}
