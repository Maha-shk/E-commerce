const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check the order with product relations
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
    console.log('Testing image logic from service:');
    order.items.forEach(item => {
      let imageUrl = `https://images.unsplash.com/photo-1598300042267-174c1e13cd2c?w=400&h=400&fit=crop`;
      console.log(`\n${item.name}:`);
      console.log(`  Has product: ${!!item.product}`);
      if (item.product && item.product.images.length > 0) {
        const firstImage = item.product.images[0];
        imageUrl = firstImage.url || firstImage;
        console.log(`  Using real image: ${imageUrl}`);
      } else {
        console.log(`  Using placeholder: ${imageUrl}`);
      }
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
