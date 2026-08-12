import { Global, Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';

/**
 * Global so that TenantGuard — registered as an APP_GUARD in AppModule — can
 * inject TenantsService without every feature module importing this one.
 */
@Global()
@Module({
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenancyModule {}
