const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = [
    { sku: 'AS-900-PR', images: ['https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&h=600&fit=crop'] },
    { sku: 'VP-5000-X', images: ['https://images.unsplash.com/photo-1497440001374-f26997328c1?w=800&h=600&fit=crop'] },
    { sku: 'ISH-42-GEN3', images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop'] },
    { sku: 'CS-PRD-00123', images: ['https://images.unsplash.com/photo-1598300042267-174c1e13cd2c?w=800&h=600&fit=crop'] },
    { sku: 'HS-220-AUD', images: ['https://images.unsplash.com/photo-1545128485-c400e710279f?w=800&h=600&fit=crop'] },
    { sku: 'NB-310-MON', images: ['https://images.unsplash.com/photo-1498049860654-af1a5c076218?w=800&h=600&fit=crop'] },
    { sku: 'PD-014-ACC', images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop'] },
    { sku: 'VX-077-HUB', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'] },
    { sku: 'AK-500-KEY', images: ['https://images.unsplash.com/photo-1595225476474-90129e84ea9b?w=800&h=600&fit=crop'] },
    { sku: 'NW-200-MOU', images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=600&fit=crop'] },
    { sku: 'PS-880-INF', images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop'] },
    { sku: 'GB-140-PWR', images: ['https://images.unsplash.com/photo-1497440001374-f26997328c1?w=800&h=600&fit=crop'] },
    { sku: 'QS-200-CAM', images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop'] },
    { sku: 'ST-150-SPA', images: ['https://images.unsplash.com/photo-1545128485-c400e710279f?w=800&h=600&fit=crop'] },
    { sku: 'ER-300-WRT', images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop'] },
  ];

  for (const productData of products) {
    const product = await prisma.product.findUnique({
      where: { sku: productData.sku },
      include: { images: true }
    });

    if (product && product.images.length === 0) {
      // Add images to the product
      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: {
            create: productData.images.map((url, index) => ({
              url,
              position: index
            }))
          }
        }
      });
      console.log(`Added images to ${product.name}`);
    } else if (product && product.images.length > 0) {
      console.log(`${product.name} already has images`);
    } else {
      console.log(`Product ${productData.sku} not found`);
    }
  }

  console.log('Done adding product images!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
