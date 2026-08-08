import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PublicService } from './public.service';
import { ContactFormDto } from './dto/contact.dto';

/**
 * Reads an optional boolean query param.
 *
 * Absent stays `undefined` (meaning "no opinion", not `false`); everything else
 * is true unless it explicitly reads as false. Query strings are always text,
 * so `Boolean(value)` would turn "false" and "0" into `true`.
 */
function parseBooleanParam(value?: string): boolean | undefined {
  if (value === undefined) return undefined;
  return !['false', '0', 'no', ''].includes(value.toLowerCase());
}

@ApiTags('public')
@Public()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('banners')
  async getBanners(
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: number,
  ) {
    return this.publicService.getBanners({
      type,
      isActive: parseBooleanParam(isActive),
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
    // Taken as strings and coerced explicitly rather than relying on the
    // ValidationPipe's implicit primitive conversion. It happens to do the
    // right thing today, but a naive Boolean() cast reads the string "false"
    // as true, and these flags decide whether a whole section is filtered.
    @Query('bestsellers') bestsellers?: string,
    @Query('newArrivals') newArrivals?: string,
    @Query('sale') sale?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.publicService.getProducts({
      categoryId,
      search,
      bestsellers: parseBooleanParam(bestsellers),
      newArrivals: parseBooleanParam(newArrivals),
      sale: parseBooleanParam(sale),
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
