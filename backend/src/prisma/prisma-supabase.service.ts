import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * Hybrid Prisma-Service that works with Supabase when direct DB connection isn't available
 * This service provides the same interface as PrismaService but uses Supabase API underneath
 */
@Injectable()
export class PrismaSupabaseService {
  private readonly logger = new Logger(PrismaSupabaseService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.logger.log('Prisma-Supabase hybrid service initialized');
  }

  /**
   * Generic findMany method
   */
  async findMany(table: string, options?: any) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from(table)
      .select(options?.select || '*')
      .order(options?.orderBy || 'created_at', { ascending: false })
      .limit(options?.limit || 100);

    if (error) throw error;
    return data;
  }

  /**
   * Generic findUnique method
   */
  async findUnique(table: string, where: any) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from(table)
      .select('*')
      .match(where)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Generic create method
   */
  async create(table: string, data: any) {
    const client = this.supabaseService.getAdminClient();
    const { data: result, error } = await client
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Generic update method
   */
  async update(table: string, where: any, data: any) {
    const client = this.supabaseService.getAdminClient();
    const { data: result, error } = await client
      .from(table)
      .update(data)
      .match(where)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Generic delete method
   */
  async delete(table: string, where: any) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from(table)
      .delete()
      .match(where)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const client = this.supabaseService.getAdminClient();
      const { error } = await client.from('_health_check_').select('*').limit(1);
      // PGRST116 means table doesn't exist but connection works
      return !error || error.code === 'PGRST116';
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }
}
