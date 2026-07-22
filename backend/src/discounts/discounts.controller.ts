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
import { DiscountsService } from './discounts.service';
import {
  CreateDiscountDto,
  DiscountQueryDto,
  UpdateDiscountDto,
} from './dto/discount.dto';

@ApiTags('admin/discounts')
@ApiBearerAuth()
@Controller('admin/discounts')
@Roles(...ADMIN_ROLES)
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  @Get()
  @ApiOperation({ summary: 'List discount campaigns (paginated, filterable)' })
  findAll(@Query() query: DiscountQueryDto) {
    return this.discounts.findAll(query);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Check whether a discount code is currently usable' })
  validate(@Param('code') code: string) {
    return this.discounts.validateCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single discount' })
  findOne(@Param('id') id: string) {
    return this.discounts.findOne(id);
  }

  @Post()
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Create a discount campaign' })
  create(@Body() dto: CreateDiscountDto) {
    return this.discounts.create(dto);
  }

  @Patch(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a discount campaign' })
  update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    return this.discounts.update(id, dto);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Delete a discount campaign' })
  remove(@Param('id') id: string) {
    return this.discounts.remove(id);
  }
}
