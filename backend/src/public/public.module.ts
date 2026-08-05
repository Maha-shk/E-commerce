import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicOrdersController } from './public-orders.controller';
import { PublicService } from './public.service';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [ProductsModule, CategoriesModule, MessagesModule],
  controllers: [PublicController, PublicOrdersController],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
