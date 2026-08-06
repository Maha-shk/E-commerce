import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrders() {
  const user = await prisma.user.findUnique({
    where: { email: 'jixon35282@aghism.com' },
    select: { id: true, email: true, fullName: true }
  });

  if (!user) {
    console.log('❌ User jixon35282@aghism.com does NOT exist in database');
    console.log('\n📧 Available seeded customers:');
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { email: true, fullName: true },
      take: 5
    });
    customers.forEach(c => console.log(`   - ${c.email} (${c.fullName})`));
    return;
  }

  console.log('✅ User found:', user);

  const orders = await prisma.order.findMany({
    where: { customerId: user.id },
    select: {
      orderNumber: true,
      status: true,
      placedAt: true,
      items: true
    }
  });

  console.log(`📦 Orders for jixon35282@aghism.com: ${orders.length}`);
  if (orders.length > 0) {
    orders.forEach(o => {
      console.log(`   - ${o.orderNumber}: ${o.status} (${o.items.length} items)`);
    });
  } else {
    console.log('   No orders found for this user');
  }
}

checkOrders()
  .then(() => prisma.$disconnect())
  .catch(console.error);
