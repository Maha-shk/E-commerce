import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  // Products validate their Model through CatalogService, which is also what
  // enforces that the model belongs to the calling tenant.
  imports: [CatalogModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
