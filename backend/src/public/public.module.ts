import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicCatalogController } from './public-catalog.controller';
import { PublicOrdersController } from './public-orders.controller';
import { PublicService } from './public.service';
import { ProductsModule } from '../products/products.module';
import { CatalogModule } from '../catalog/catalog.module';
import { MessagesModule } from '../messages/messages.module';
import { DiscountsModule } from '../discounts/discounts.module';

@Module({
  imports: [ProductsModule, CatalogModule, MessagesModule, DiscountsModule],
  controllers: [
    PublicCatalogController,
    PublicController,
    PublicOrdersController,
  ],
  providers: [PublicService],
  exports: [PublicService],
})
export class PublicModule {}
