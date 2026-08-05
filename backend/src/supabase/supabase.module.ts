import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseConfig } from '../config/supabase.config';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SupabaseConfig, SupabaseService],
  exports: [SupabaseConfig, SupabaseService],
})
export class SupabaseModule {}
