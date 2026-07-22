import { Body, Controller, Delete, Get, Param, Patch, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { ADMIN_ROLES, OWNER_ROLES } from '../common/constants/roles.constants';
import { SettingsService } from './settings.service';

@ApiTags('admin/settings')
@ApiBearerAuth()
@Controller('admin/settings')
@Roles(...ADMIN_ROLES)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'All settings sections (defaults applied where unset)' })
  findAll() {
    return this.settings.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'A single settings section' })
  findOne(@Param('key') key: string) {
    return this.settings.findOne(key);
  }

  @Put()
  @Roles(...OWNER_ROLES)
  @ApiBody({
    description: 'Map of section key -> value, e.g. { "payments": { "cod": true } }',
  })
  @ApiOperation({ summary: 'Bulk-update several settings sections' })
  updateMany(@Body() payload: Record<string, Prisma.InputJsonValue>) {
    return this.settings.updateMany(payload);
  }

  @Patch(':key')
  @Roles(...OWNER_ROLES)
  @ApiOperation({ summary: 'Update one settings section' })
  update(
    @Param('key') key: string,
    @Body() body: { value: Prisma.InputJsonValue },
  ) {
    return this.settings.update(key, body?.value);
  }

  @Delete(':key')
  @Roles(...OWNER_ROLES)
  @ApiOperation({ summary: 'Reset a settings section to its default' })
  reset(@Param('key') key: string) {
    return this.settings.reset(key);
  }
}
