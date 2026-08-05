import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SupabaseConfig {
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private supabaseServiceRoleKey: string;

  constructor(private configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    this.supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY') || '';
    this.supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';
  }

  /**
   * Create a Supabase client with the anonymous key
   * Use this for client-side operations or when user context is needed
   */
  createAnonClient() {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key are required');
    }
    return createClient(this.supabaseUrl, this.supabaseAnonKey);
  }

  /**
   * Create a Supabase client with the service role key
   * Use this for admin operations that bypass row-level security
   * WARNING: Keep this key secure and never expose it to clients
   */
  createAdminClient() {
    if (!this.supabaseUrl || !this.supabaseServiceRoleKey) {
      throw new Error('Supabase URL and Service Role Key are required');
    }
    return createClient(this.supabaseUrl, this.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  /**
   * Get the Supabase URL
   */
  getUrl(): string {
    return this.supabaseUrl;
  }

  /**
   * Check if Supabase is properly configured
   */
  isConfigured(): boolean {
    return !!(this.supabaseUrl && this.supabaseAnonKey && this.supabaseServiceRoleKey);
  }
}
