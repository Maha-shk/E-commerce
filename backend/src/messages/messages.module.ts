import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { CustomerMessagesController } from './customer-messages.controller';

@Module({
  controllers: [MessagesController, CustomerMessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
