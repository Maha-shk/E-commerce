import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HealthController } from './health/health.controller';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { BannersModule } from './banners/banners.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { DiscountsModule } from './discounts/discounts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { SettingsModule } from './settings/settings.module';
import { PublicModule } from './public/public.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { SupabaseModule } from './supabase/supabase.module';
import { AddressesModule } from './addresses/addresses.module';

@Module({
  imports: [
    // Global, validated configuration. Fails fast on missing/invalid env vars.
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
    }),

    // Basic rate limiting: 100 requests / 60s per IP by default.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Infrastructure
    PrismaModule,
    MailModule,
    SupabaseModule,

    // Auth & identity
    AuthModule,
    UsersModule,

    // Public API
    PublicModule,
    CartModule,
    WishlistModule,
    AddressesModule,

    // Admin dashboard features
    DashboardModule,
    CategoriesModule,
    BannersModule,
    ProductsModule,
    InventoryModule,
    OrdersModule,
    CustomersModule,
    DiscountsModule,
    ReportsModule,
    NotificationsModule,
    MessagesModule,
    SettingsModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: throttle first, then authenticate, then authorise.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
