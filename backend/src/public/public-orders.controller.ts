import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';
import { CreatePublicOrderDto } from './dto/create-order.dto';

@ApiTags('public')
@Public()
@Controller('public/orders')
export class PublicOrdersController {
  constructor(private readonly publicService: PublicService) {}

  /**
   * The body was previously typed `any`, which meant the global ValidationPipe
   * had no metatype to validate against and every field went through unchecked.
   */
  @Post()
  @ApiOperation({ summary: 'Create customer order (public endpoint - no auth required)' })
  async createOrder(@Body() dto: CreatePublicOrderDto) {
    return this.publicService.createOrder(dto);
  }

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Get order by order number (public endpoint - no auth required)' })
  async getOrderByNumber(@Param('orderNumber') orderNumber: string) {
    return this.publicService.getOrderByNumber(orderNumber);
  }
}