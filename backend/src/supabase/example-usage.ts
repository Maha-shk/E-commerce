/**
 * Example usage of SupabaseService in your controllers/services
 */

import { Controller, Get, Post, Body, Inject } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('examples')
export class ExampleController {
  constructor(
    @Inject(SupabaseService) private readonly supabaseService: SupabaseService,
  ) {}

  /**
   * Example: Using Supabase for direct database queries
   * This complements your Prisma ORM usage
   */
  @Get('supabase-test')
  async testSupabase() {
    if (!this.supabaseService.isConfigured()) {
      return { message: 'Supabase is not configured' };
    }

    const client = this.supabaseService.getAdminClient();

    // Query users using Supabase client
    const { data, error } = await client
      .from('user')
      .select('id, email, fullName, role')
      .limit(5);

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    return { users: data };
  }

  /**
   * Example: Using Supabase for file uploads
   */
  @Post('upload-image')
  async uploadImage(@Body('imageBase64') imageBase64: string) {
    const buffer = Buffer.from(imageBase64, 'base64');
    const fileName = `product-${Date.now()}.jpg`;

    try {
      const publicUrl = await this.supabaseService.uploadFile(
        'products',
        fileName,
        buffer,
        'image/jpeg'
      );

      return { url: publicUrl };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Example: Real-time subscription
   */
  @Get('subscribe-orders')
  async subscribeToOrders() {
    const client = this.supabaseService.getAdminClient();

    // Subscribe to new orders
    const subscription = client
      .channel('new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order',
        },
        (payload) => {
          console.log('New order:', payload.new);
        }
      )
      .subscribe();

    return {
      message: 'Subscribed to new orders',
      channelId: subscription.topic
    };
  }
}

/**
 * Example: Using Supabase in services
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
  constructor(
    @Inject(SupabaseService) private readonly supabaseService: SupabaseService,
  ) {}

  async getFeaturedProducts() {
    // You can mix Prisma and Supabase clients
    // Use Prisma for complex queries with type safety
    // Use Supabase for simple queries or real-time features

    if (this.supabaseService.isConfigured()) {
      const client = this.supabaseService.getAdminClient();

      const { data, error } = await client
        .from('product')
        .select('*, category(*)')
        .eq('status', 'IN_STOCK')
        .order('createdAt', { ascending: false })
        .limit(10);

      if (!error && data) {
        return data;
      }
    }

    // Fallback to Prisma or throw error
    return []; // or use Prisma fallback
  }
}
