import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';

@ApiTags('public')
@Public()
@Controller('public/orders')
export class PublicOrdersController {
  constructor(private readonly publicService: PublicService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer order (public endpoint - no auth required)' })
  async createOrder(@Body() orderData: any) {
    return this.publicService.createOrder(orderData);
  }

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Get order by order number (public endpoint - no auth required)' })
  async getOrderByNumber(@Param('orderNumber') orderNumber: string) {
    return this.publicService.getOrderByNumber(orderNumber);
  }
}