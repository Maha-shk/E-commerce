import { Module } from '@nestjs/common';
import { StockNotificationsModule } from '../stock-notifications/stock-notifications.module';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [StockNotificationsModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
