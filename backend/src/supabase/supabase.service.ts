import { Injectable, Logger } from '@nestjs/common';
import { SupabaseConfig } from '../config/supabase.config';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private adminClient: SupabaseClient;
  private anonClient: SupabaseClient;
  /** Buckets already confirmed to exist, so the check runs once per process. */
  private readonly knownBuckets = new Set<string>();

  constructor(private supabaseConfig: SupabaseConfig) {
    if (supabaseConfig.isConfigured()) {
      this.adminClient = supabaseConfig.createAdminClient();
      this.anonClient = supabaseConfig.createAnonClient();
      this.logger.log('Supabase service initialized successfully');
    } else {
      this.logger.warn('Supabase is not configured. Some features may be limited.');
    }
  }

  /**
   * Get the admin Supabase client
   * Use this for server-side operations that require elevated privileges
   */
  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      throw new Error('Supabase admin client is not configured');
    }
    return this.adminClient;
  }

  /**
   * Get the anonymous Supabase client
   * Use this for operations that respect RLS policies
   */
  getAnonClient(): SupabaseClient {
    if (!this.anonClient) {
      throw new Error('Supabase anon client is not configured');
    }
    return this.anonClient;
  }

  /**
   * Check if Supabase is properly configured
   */
  isConfigured(): boolean {
    return this.supabaseConfig.isConfigured();
  }

  /**
   * Get the Supabase URL
   */
  getSupabaseUrl(): string {
    return this.supabaseConfig.getUrl();
  }

  /**
   * Test the Supabase connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.adminClient.from('_test_connection_').select('*').limit(1);

      // We expect an error here because the table doesn't exist, but no error means connection works
      if (error && error.code !== 'PGRST116') {
        // PGRST116 means "table not found" which is expected
        this.logger.error('Supabase connection test failed:', error);
        return false;
      }

      this.logger.log('Supabase connection test successful');
      return true;
    } catch (error) {
      this.logger.error('Supabase connection test failed:', error);
      return false;
    }
  }

  /**
   * Creates a public storage bucket if it isn't there yet.
   *
   * Storage buckets aren't provisioned by the Prisma migrations, and a fresh
   * Supabase project has none — so an upload to a bucket nobody created by hand
   * fails with a bare "Bucket not found". Doing it here makes storage-backed
   * features work on any environment without a manual dashboard step.
   *
   * Idempotent: a duplicate-name error means another request won the race, so
   * it is treated as success.
   */
  async ensureBucket(bucket: string, isPublic = true): Promise<void> {
    if (this.knownBuckets.has(bucket)) return;

    const { data } = await this.adminClient.storage.getBucket(bucket);
    if (data) {
      this.knownBuckets.add(bucket);
      return;
    }

    const { error } = await this.adminClient.storage.createBucket(bucket, {
      public: isPublic,
    });

    // "already exists" is the concurrent-creation case, not a failure.
    if (error && !/already exists/i.test(error.message)) {
      this.logger.error(`Could not create bucket "${bucket}": ${error.message}`);
      throw new Error(`Failed to create storage bucket: ${error.message}`);
    }

    this.logger.log(`Storage bucket "${bucket}" ready`);
    this.knownBuckets.add(bucket);
  }

  /**
   * Helper method to upload files to Supabase Storage
   */
  async uploadFile(bucket: string, path: string, file: Buffer | Uint8Array, contentType: string): Promise<string> {
    await this.ensureBucket(bucket);

    const { data, error } = await this.adminClient
      .storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true
      });

    if (error) {
      this.logger.error(`File upload failed: ${error.message}`);
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: { publicUrl } } = this.adminClient
      .storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  }

  /**
   * Helper method to delete files from Supabase Storage
   */
  async deleteFile(bucket: string, paths: string[]): Promise<void> {
    const { error } = await this.adminClient
      .storage
      .from(bucket)
      .remove(paths);

    if (error) {
      this.logger.error(`File deletion failed: ${error.message}`);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}
