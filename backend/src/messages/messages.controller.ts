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
  findAll(@Query() query: ConversationQueryDto) {
    return this.messages.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Full conversation thread plus customer context' })
  findOne(@Param('id') id: string) {
    return this.messages.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Start (or reuse) a conversation with a customer' })
  start(@Body() dto: StartConversationDto) {
    return this.messages.start(dto);
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Send an admin reply in a conversation' })
  reply(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.messages.reply(id, dto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Clear the unread counter' })
  markRead(@Param('id') id: string) {
    return this.messages.markRead(id);
  }

  @Delete(':id')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Delete a conversation' })
  remove(@Param('id') id: string) {
    return this.messages.remove(id);
  }
}
