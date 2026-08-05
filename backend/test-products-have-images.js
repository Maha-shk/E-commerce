const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check the order items
  const order = await prisma.order.findFirst({
    where: { orderNumber: 'ORD-2026-8715' },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true
            }
          }
        }
      }
    }
  });

  if (order) {
    console.log('Order items with products:');
    order.items.forEach(item => {
      console.log(`\n${item.name}:`);
      console.log(`  Product ID: ${item.productId}`);
      console.log(`  Product: ${item.product ? 'Found' : 'Not found'}`);
      if (item.product) {
        console.log(`  Product images count: ${item.product.images.length}`);
        if (item.product.images.length > 0) {
          console.log(`  First image URL: ${item.product.images[0].url}`);
        }
      }
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
