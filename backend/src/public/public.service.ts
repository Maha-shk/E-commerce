import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { MessagesService } from '../messages/messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessageDirection, Role, OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { ContactFormDto } from './dto/contact.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
    private readonly messagesService: MessagesService,
    private readonly prisma: PrismaService,
  ) {}

  async getBanners(params?: any) {
    // Return empty array for now - this was used for homepage
    return {
      success: true,
      data: [],
    };
  }

  async getCategories(params?: any) {
    const result = await this.categoriesService.findAll(params);

    return {
      success: true,
      data: result.data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        thumbnailName: cat.thumbnailName || null,
        productCount: cat.products || 0,
      })),
    };
  }

  async getProducts(params?: any) {
    // Ensure pagination params have defaults
    const page = params?.page ? Number(params.page) : 1;
    const limit = params?.limit ? Number(params.limit) : 20;

    const queryParams = {
      page,
      limit,
      skip: (page - 1) * limit,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
      ...(params?.categoryId && { categoryId: params.categoryId }),
      ...(params?.search && { search: params.search }),
      ...(params?.status && { status: params.status }),
      ...(params?.visibility && { visibility: params.visibility }),
    };

    const products = await this.productsService.findAll(queryParams);

    return {
      success: true,
      data: products.data.map((product: any) => {
        const discount = product.discount || 0;
        const price = Number(product.price) || 0;
        const stock = product.stock || 0;
        const salePrice = price - (price * (discount / 100));
        const images = product.images || [];
        const variants = product.variants || [];

        return {
          id: product.id,
          name: product.name,
          brand: product.brand || '',
          description: product.description || '',
          sku: product.sku || '',
          stock: stock,
          status: product.status || 'IN_STOCK',
          price: price,
          discount: discount,
          visibility: product.visibility || 'PUBLIC',
          scheduledDate: product.scheduledDate || null,
          tags: product.tags || [],
          categoryId: product.categoryId || null,
          category: product.category ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
          } : null,
          images: images,
          variants: variants,
          variantCount: variants.length,
          inStock: stock > 0,
          lowStock: stock > 0 && stock <= 10,
          salePrice: salePrice,
          discountPercent: discount,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };
      }),
      meta: products.meta,
    };
  }

  async getProduct(params: { id?: string; slug?: string }) {
    if (!params.id) {
      throw new Error('Product ID is required');
    }

    const product = await this.productsService.findOne(params.id);

    const discount = product.discount || 0;
    const price = Number(product.price) || 0;
    const stock = product.stock || 0;
    const salePrice = price - (price * (discount / 100));
    const images = product.images || [];
    const variants = product.variants || [];

    return {
      success: true,
      data: {
        id: product.id,
        name: product.name,
        brand: product.brand || '',
        description: product.description || '',
        sku: product.sku || '',
        stock: stock,
        status: product.status || 'IN_STOCK',
        price: price,
        discount: discount,
        visibility: product.visibility || 'PUBLIC',
        scheduledDate: product.scheduledDate || null,
        tags: product.tags || [],
        categoryId: product.categoryId || null,
        category: product.category ? {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        } : null,
        images: images,
        variants: variants,
        variantCount: variants.length,
        inStock: stock > 0,
        lowStock: stock > 0 && stock <= 10,
        salePrice: salePrice,
        discountPercent: discount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    };
  }

  async getFeaturedProducts(params: { section: string; limit?: number }) {
    const limit = params.limit || 4;
    const queryParams = {
      page: 1,
      limit: params.section === 'SALE' ? 50 : limit, // Get more products first so we can filter
      skip: 0,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    };

    const products = await this.productsService.findAll(queryParams);

    // For SALE section, filter products that actually have discounts
    let filteredProducts = products.data;
    if (params.section === 'SALE') {
      filteredProducts = products.data.filter((product: any) => {
        const discount = product.discount || 0;
        return discount > 0;
      }).slice(0, limit); // Then limit to requested amount
    } else {
      filteredProducts = products.data.slice(0, limit);
    }

    return {
      success: true,
      data: filteredProducts.map((product: any) => {
        const discount = product.discount || 0;
        const price = Number(product.price) || 0;
        const stock = product.stock || 0;
        const salePrice = price - (price * (discount / 100));
        const images = product.images || [];
        const variants = product.variants || [];

        return {
          id: product.id,
          name: product.name,
          brand: product.brand || '',
          description: product.description || '',
          sku: product.sku || '',
          stock: stock,
          status: product.status || 'IN_STOCK',
          price: price,
          discount: discount,
          visibility: product.visibility || 'PUBLIC',
          scheduledDate: product.scheduledDate || null,
          tags: product.tags || [],
          categoryId: product.categoryId || null,
          category: product.category ? {
            id: product.category.id,
            name: product.category.name,
            slug: product.category.slug,
          } : null,
          images: images,
          variants: variants,
          variantCount: variants.length,
          inStock: stock > 0,
          lowStock: stock > 0 && stock <= 10,
          salePrice: salePrice,
          discountPercent: discount,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };
      }),
    };
  }

  async getBrands() {
    // Fetch all products to extract unique brands
    const queryParams = {
      page: 1,
      limit: 1000, // Get all products to extract brands
      skip: 0,
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
    };

    const products = await this.productsService.findAll(queryParams);

    // Extract unique brands and filter out null/empty values
    const brands = [...new Set(
      products.data
        .map((product: any) => product.brand)
        .filter((brand: string) => brand && brand.trim().length > 0)
    )].sort(); // Sort alphabetically

    return {
      success: true,
      data: brands,
    };
  }

  async submitContactForm(data: ContactFormDto) {
    // Check if a customer with this email already exists
    let customer = await this.prisma.user.findFirst({
      where: {
        email: data.email,
        role: Role.CUSTOMER,
      },
      select: { id: true },
    });

    // If no customer exists, create a new guest customer
    if (!customer) {
      customer = await this.prisma.user.create({
        data: {
          email: data.email,
          fullName: data.name,
          role: Role.CUSTOMER,
          status: 'ACTIVE',
          // Generate a random password for guest customers (they can reset it later)
          passwordHash: Buffer.from(Math.random().toString()).toString('base64'),
        },
        select: { id: true },
      });
    }

    // Check if there's an existing conversation for this customer
    const existingConversation = await this.prisma.conversation.findFirst({
      where: { customerId: customer.id },
      select: { id: true },
    });

    // Prepare the message text with subject
    const messageText = `[${data.subject}]\n\n${data.message}`;

    if (existingConversation) {
      // Add message to existing conversation
      await this.prisma.message.create({
        data: {
          conversationId: existingConversation.id,
          direction: MessageDirection.INCOMING,
          text: messageText,
        },
      });

      // Update conversation's last message time and unread count
      await this.prisma.conversation.update({
        where: { id: existingConversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
        },
      });

      return {
        success: true,
        data: {
          conversationId: existingConversation.id,
          message: 'Your message has been sent successfully!',
        },
      };
    } else {
      // Create new conversation with the message
      const conversation = await this.prisma.conversation.create({
        data: {
          customerId: customer.id,
          messages: {
            create: {
              direction: MessageDirection.INCOMING,
              text: messageText,
            },
          },
          unreadCount: 1,
        },
      });

      return {
        success: true,
        data: {
          conversationId: conversation.id,
          message: 'Your message has been sent successfully!',
        },
      };
    }
  }

  async createOrder(orderData: any) {
    try {
      const {
        contactInfo,
        shippingAddress,
        deliveryMethod,
        items,
        subtotal,
        shippingCost,
        total
      } = orderData;

      // Validate required fields
      if (!contactInfo || !contactInfo.email || !contactInfo.phone) {
        throw new Error('Contact information is required');
      }

      if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.address ||
          !shippingAddress.city || !shippingAddress.country || !shippingAddress.postalCode) {
        throw new Error('Shipping address is required');
      }

      if (!items || items.length === 0) {
        throw new Error('Order must contain at least one item');
      }

      // Generate order number
      const orderNumber = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create or get customer
      let customer = await this.prisma.user.findFirst({
        where: {
          email: contactInfo.email,
          role: Role.CUSTOMER,
        },
      });

      if (!customer) {
        // Create new customer if doesn't exist
        customer = await this.prisma.user.create({
          data: {
            email: contactInfo.email,
            fullName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
            phone: contactInfo.phone,
            role: Role.CUSTOMER,
            status: 'ACTIVE',
            emailVerified: true,
            passwordHash: Buffer.from(Math.random().toString()).toString('base64'), // Random password
          },
        });
      }

      // Create order items with correct structure
      const orderItems = items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        sku: `SKU-${item.productId}`, // Generate SKU if not provided
        quantity: item.quantity,
        unitPrice: item.price,
      }));

      // Format shipping address as array of strings
      const addressLines = [
        `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        shippingAddress.address,
        shippingAddress.apartment,
        `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`,
        shippingAddress.country,
      ].filter((line) => line && line.trim() !== '');

      // Calculate estimated delivery date (5-7 business days)
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + (deliveryMethod === 'express' ? 3 : 7));

      // Create the order
      const order = await this.prisma.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: orderItems,
          },
          shippingAddress: addressLines,
          shippingMethod: deliveryMethod === 'express' ? 'Express Delivery (DHL)' : 'Standard Delivery (BRT)',
          shippingCost: shippingCost,
          discount: 0,
        },
      });

      return {
        success: true,
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          customerEmail: customer.email,
          customerName: customer.fullName,
          shippingAddress: addressLines,
          paymentMethod: 'Credit Card',
          items: items,
          subtotal,
          shippingCost,
          total,
          estimatedDelivery,
          createdAt: order.createdAt,
        },
      };
    } catch (error) {
      console.error('Order creation error:', error);
      throw error;
    }
  }

  async getOrderByNumber(orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber: orderNumber,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }

    // Calculate estimated delivery date
    const estimatedDelivery = new Date(order.createdAt);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + (order.shippingMethod?.includes('Express') ? 3 : 7));

    // Calculate totals from items
    const subtotal = order.items.reduce((sum, item) => {
      return sum + Number(item.unitPrice) * item.quantity;
    }, 0);

    const shippingCost = Number(order.shippingCost) || 0;
    const discount = Number(order.discount) || 0;
    const total = subtotal + shippingCost - discount;

    return {
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        customerName: order.customer?.fullName || 'Guest',
        customerEmail: order.customer?.email || '',
        shippingAddress: {
          fullName: order.shippingAddress[0] || '',
          address: order.shippingAddress[1] || '',
          apartment: order.shippingAddress[2] || '',
          city: order.shippingAddress[3] || '',
          state: '',
          postalCode: '',
          country: order.shippingAddress[4] || '',
        },
        paymentMethod: order.paymentMethod || 'Credit Card',
        items: order.items.map((item: any) => {
          // Get product image if available, otherwise use placeholder
          let imageUrl = `https://images.unsplash.com/photo-1598300042267-174c1e13cd2c?w=400&h=400&fit=crop`;
          if (item.product && item.product.images && item.product.images.length > 0) {
            const firstImage = item.product.images[0];
            imageUrl = firstImage.url || firstImage;
          }

          return {
            id: item.id,
            name: item.name,
            price: Number(item.unitPrice),
            salePrice: Number(item.unitPrice),
            discount: 0,
            quantity: item.quantity,
            image: imageUrl,
            color: '',
          };
        }),
        subtotal,
        shipping: shippingCost,
        tax: 0,
        total,
        estimatedDelivery: estimatedDelivery.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
      },
    };
  }
}
