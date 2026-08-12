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
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { MessagesService } from './messages.service';
import {
  ConversationQueryDto,
  SendMessageDto,
  StartConversationDto,
} from './dto/message.dto';

@ApiTags('admin/messages')
@ApiBearerAuth()
@Controller('admin/messages')
@Roles(...ADMIN_ROLES)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'List conversations with last-message previews' })
  findAll(
    @CurrentTenant('id') tenantId: string,
    @Query() query: ConversationQueryDto,
  ) {
    return this.messages.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Full conversation thread plus customer context' })
  findOne(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.messages.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Start (or reuse) a conversation with a customer' })
  start(
    @CurrentTenant('id') tenantId: string,
    @Body() dto: StartConversationDto,
  ) {
    return this.messages.start(tenantId, dto);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Send an admin reply in a conversation' })
  reply(
    @CurrentTenant('id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messages.reply(tenantId, id, dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Clear the unread counter' })
  markRead(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.messages.markRead(tenantId, id);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Delete a conversation' })
  remove(@CurrentTenant('id') tenantId: string, @Param('id') id: string) {
    return this.messages.remove(tenantId, id);
  }
}
