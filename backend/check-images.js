const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: {
      images: {
        isEmpty: false
      }
    },
    select: { id: true, name: true, images: true },
    take: 5
  });
  console.log('Products with images:', JSON.stringify(products, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
