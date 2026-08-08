import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES, WRITE_ROLES } from '../common/constants/roles.constants';
import { BannersService } from './banners.service';
import {
  BannerQueryDto,
  CreateBannerDto,
  ReorderBannersDto,
  UpdateBannerDto,
} from './dto/banner.dto';

/**
 * Admin CRUD for storefront banners.
 *
 * Reads are open to every admin role; writes exclude the read-only SUPPORT
 * role, matching how products and categories are gated.
 */
@ApiTags('admin/banners')
@ApiBearerAuth()
@Controller('admin/banners')
@Roles(...ADMIN_ROLES)
export class BannersController {
  constructor(private readonly banners: BannersService) {}

  @Get()
  @ApiOperation({ summary: 'List banners (paginated, filterable by type/status)' })
  findAll(@Query() query: BannerQueryDto) {
    return this.banners.findAll(query);
  }

  /**
   * Declared before `:id` — Nest matches routes in declaration order, so a
   * literal segment has to precede the parameterised one or "reorder" would be
   * read as an id.
   */
  @Patch('reorder')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Set banner display order from an ordered id list' })
  reorder(@Body() dto: ReorderBannersDto) {
    return this.banners.reorder(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single banner' })
  findOne(@Param('id') id: string) {
    return this.banners.findOne(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create a banner' })
  create(@Body() dto: CreateBannerDto) {
    return this.banners.create(dto);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a banner' })
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.banners.update(id, dto);
  }

  @Patch(':id/active')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Publish or unpublish a banner' })
  setActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.banners.setActive(id, body.isActive !== false);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Delete a banner' })
  remove(@Param('id') id: string) {
    return this.banners.remove(id);
  }
}
