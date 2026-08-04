import { Controller, Get, Query, Param } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';

@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('banners')
  async getBanners(
    @Query('type') type?: string,
    @Query('isActive') isActive?: boolean,
    @Query('limit') limit?: number,
  ) {
    return this.publicService.getBanners({ type, isActive, limit });
  }

  @Get('categories')
  async getCategories(
    @Query('parentId') parentId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.publicService.getCategories({ parentId, limit });
  }

  @Get('products')
  async getProducts(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('bestsellers') bestsellers?: boolean,
    @Query('newArrivals') newArrivals?: boolean,
    @Query('sale') sale?: boolean,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.publicService.getProducts({
      categoryId,
      search,
      bestsellers,
      newArrivals,
      sale,
      page,
      limit,
    });
  }

  @Get('products/detail')
  async getProduct(
    @Query('id') id?: string,
    @Query('slug') slug?: string,
  ) {
    return this.publicService.getProduct({ id, slug });
  }

  @Get('featured-products')
  async getFeaturedProducts(
    @Query('section') section: string,
    @Query('limit') limit?: number,
  ) {
    return this.publicService.getFeaturedProducts({ section, limit });
  }
}
