const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
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
    console.log('Testing image logic for order items:');
    order.items.forEach(item => {
      let imageUrl = `https://images.unsplash.com/photo-1598300042267-174c1e13cd2c?w=400&h=400&fit=crop`;
      console.log(`\n${item.name}:`);
      console.log(`  Has product: ${!!item.product}`);
      if (item.product) {
        console.log(`  Product images count: ${item.product.images.length}`);
        if (item.product.images.length > 0) {
          const firstImage = item.product.images[0];
          console.log(`  First image:`, firstImage);
          imageUrl = firstImage.url || firstImage;
        }
      }
      console.log(`  Final image URL: ${imageUrl}`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
