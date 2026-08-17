import { Module } from '@nestjs/common';
import { StockNotificationsService } from './stock-notifications.service';
import {
  AdminStockNotificationsController,
  PublicStockNotificationsController,
} from './stock-notifications.controller';

@Module({
  controllers: [
    PublicStockNotificationsController,
    AdminStockNotificationsController,
  ],
  providers: [StockNotificationsService],
  // Exported so every path that writes stock upward can discharge the waiting
  // list — inventory adjustments and the product form both do.
  exports: [StockNotificationsService],
})
export class StockNotificationsModule {}
