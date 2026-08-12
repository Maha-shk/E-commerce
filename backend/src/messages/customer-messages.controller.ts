import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentTenant } from '../tenancy/decorators/current-tenant.decorator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/message.dto';

/**
 * The customer side of support messaging.
 *
 * Separate from `admin/messages` because the scoping rule is different: every
 * route here is bound to the signed-in customer's own id, taken from the access
 * token. No conversation id from the client can widen that — `addCustomerMessage`
 * matches on `{ id, customerId }`, so posting someone else's conversation id
 * returns 404 rather than writing into their thread.
 *
 * Not `@Public()`: an inbox requires an account.
 */
@ApiTags('account/messages')
@ApiBearerAuth()
@Controller('account/messages')
export class CustomerMessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  @ApiOperation({ summary: "List the signed-in customer's support conversations" })
  findAll(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messages.findAllForCustomer(tenantId, userId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add a follow-up message to your own conversation' })
  addMessage(
    @CurrentTenant('id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messages.addCustomerMessage(
      tenantId,
      userId,
      conversationId,
      dto.text,
    );
  }
}
