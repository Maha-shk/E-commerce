import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
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
    @CurrentTenant('id') tenantId: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: number,
  ) {
    return this.publicService.getBanners(tenantId, {
      type,
      isActive: parseBooleanParam(isActive),
      limit,
    });
  }

  @Get('categories')
  async getCategories(
    @CurrentTenant('id') tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.publicService.getCategories(tenantId, { limit });
  }

  @Get('products')
  async getProducts(
    @CurrentTenant('id') tenantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('companyId') companyId?: string,
    @Query('productTypeId') productTypeId?: string,
    @Query('modelId') modelId?: string,
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
    return this.publicService.getProducts(tenantId, {
      categoryId,
      companyId,
      productTypeId,
      modelId,
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
    @CurrentTenant('id') tenantId: string,
    @Query('id') id?: string,
    @Query('slug') slug?: string,
  ) {
    return this.publicService.getProduct(tenantId, { id, slug });
  }

  @Get('featured-products')
  async getFeaturedProducts(
    @CurrentTenant('id') tenantId: string,
    @Query('section') section: string,
    @Query('limit') limit?: number,
  ) {
    return this.publicService.getFeaturedProducts(tenantId, { section, limit });
  }

  /**
   * Checks a promo code at checkout.
   *
   * The only validator lived on `/admin/discounts/validate/:code`, which is
   * admin-gated — so a customer had no way to check a code, and the checkout
   * had nowhere to send one. Brute-forcing codes is bounded by the global
   * ThrottlerGuard, and the response never reveals anything beyond whether the
   * code is usable and what it is worth.
   */
  @Get('discounts/validate/:code')
  async validateDiscount(
    @CurrentTenant('id') tenantId: string,
    @Param('code') code: string,
  ) {
    return this.publicService.validateDiscountCode(tenantId, code);
  }

  /**
   * Admin-edited body for a legal page (privacy, terms, returns, shipping).
   *
   * Returns null when the admin has never edited it, which is the storefront's
   * signal to render its own built-in copy. Without this the Settings editor
   * wrote to a value nothing could read, so edits never reached the page.
   */
  @Get('legal/:id')
  async getLegalDocument(@Param('id') id: string) {
    return this.publicService.getLegalDocument(id);
  }

  @Get('brands')
  async getBrands(
    @CurrentTenant('id') tenantId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.publicService.getBrands(tenantId, { categoryId });
  }

  @Post('contact')
  @ApiOperation({ summary: 'Submit contact form (public endpoint - no auth required)' })
  async submitContactForm(
    @CurrentTenant('id') tenantId: string,
    @Body() contactFormDto: ContactFormDto,
  ) {
    return this.publicService.submitContactForm(tenantId, contactFormDto);
  }
}
