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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ADMIN_ROLES, OWNER_ROLES } from '../common/constants/roles.constants';
import { UsersService } from './users.service';
import {
  CreateStaffDto,
  StaffQueryDto,
  UpdateProfileDto,
  UpdateStaffDto,
} from './dto/user.dto';

@ApiTags('admin/profile')
@ApiBearerAuth()
@Controller('admin/profile')
@Roles(...ADMIN_ROLES)
export class ProfileController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get the signed-in admin profile' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.users.getProfile(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the signed-in admin profile' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.updateProfile(userId, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List active sessions (trusted devices)' })
  listSessions(@CurrentUser('id') userId: string) {
    return this.users.listSessions(userId);
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Revoke one active session' })
  revokeSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.users.revokeSession(userId, sessionId);
  }
}

@ApiTags('admin/staff')
@ApiBearerAuth()
@Controller('admin/staff')
@Roles(...OWNER_ROLES)
export class StaffController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List staff accounts' })
  findAll(@Query() query: StaffQueryDto) {
    return this.users.findStaff(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a staff account' })
  create(@Body() dto: CreateStaffDto) {
    return this.users.createStaff(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff account (role/status/name)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser('id') actingUserId: string,
  ) {
    return this.users.updateStaff(id, dto, actingUserId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a staff account' })
  remove(@Param('id') id: string, @CurrentUser('id') actingUserId: string) {
    return this.users.removeStaff(id, actingUserId);
  }
}
