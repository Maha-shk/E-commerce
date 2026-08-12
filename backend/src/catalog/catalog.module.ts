import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CatalogLevelsController } from './catalog-levels.controller';

@Module({
  // Order matters: CatalogController owns the static paths (/tree, /stats,
  // /levels) and must be registered before CatalogLevelsController, whose
  // `/:level` pattern would otherwise swallow them.
  controllers: [CatalogController, CatalogLevelsController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
