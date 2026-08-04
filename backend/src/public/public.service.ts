import { Injectable } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class PublicService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
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
        icon: cat.icon || 'home',
        thumbnailName: cat.thumbnailName || null,
        parentId: cat.parentId || null,
        productCount: cat.productCount || 0,
        subcategoryCount: cat.subcategoryCount || 0,
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
}
