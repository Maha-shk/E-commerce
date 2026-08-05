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
    console.log('Order items with product images:');
    order.items.forEach(item => {
      console.log(`\n${item.name}:`);
      console.log(`  Product images:`, item.product?.images || []);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
