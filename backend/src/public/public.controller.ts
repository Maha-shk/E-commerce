import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';
import { ContactFormDto } from './dto/contact.dto';

@ApiTags('public')
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('banners')
  async getBanners(
    @Query('type') type?: string,
    // Taken as a string on purpose: query params always arrive as text, and a
    // naive Boolean() cast turns the string "false" into `true`.
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: number,
  ) {
    return this.publicService.getBanners({
      type,
      isActive: isActive === undefined ? undefined : isActive !== 'false',
      limit,
    });
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

  @Get('brands')
  async getBrands() {
    return this.publicService.getBrands();
  }

  @Post('contact')
  @ApiOperation({ summary: 'Submit contact form (public endpoint - no auth required)' })
  async submitContactForm(@Body() contactFormDto: ContactFormDto) {
    return this.publicService.submitContactForm(contactFormDto);
  }
}
