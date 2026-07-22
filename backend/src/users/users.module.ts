import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { ProfileController, StaffController } from './users.controller';

@Module({
  controllers: [ProfileController, StaffController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
