import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import bcrypt from 'bcryptjs';
import * as schema from './schema';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('DATABASE_URL not set. Seed can be run when connected to Neon Postgres.');
    process.exit(0);
  }

  const sql = neon(dbUrl);
  const db = drizzle(sql, { schema });

  const ownerUsername = process.env.SEED_OWNER_USERNAME || 'owner';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || 'Admin@1946';
  const ownerName = process.env.SEED_OWNER_NAME || 'Mahadevaiyer (Owner)';

  console.log(`Seeding database with owner user: ${ownerUsername}...`);

  const ownerHash = await bcrypt.hash(ownerPassword, 10);
  const [owner] = await db
    .insert(schema.users)
    .values({
      username: ownerUsername.toLowerCase().trim(),
      fullName: ownerName,
      passwordHash: ownerHash,
      role: 'owner',
      isActive: true,
      mustChangePassword: false,
    })
    .onConflictDoNothing()
    .returning();

  // Create staff desk user
  const staffHash = await bcrypt.hash('Staff@1946', 10);
  await db
    .insert(schema.users)
    .values({
      username: 'staff',
      fullName: 'Pollachi Counter Staff',
      passwordHash: staffHash,
      role: 'staff',
      isActive: true,
      mustChangePassword: false,
    })
    .onConflictDoNothing();

  // Seed Masters
  const mastersList = [
    { category: 'courier', name: 'DTDC' },
    { category: 'courier', name: 'ST Courier' },
    { category: 'courier', name: 'Professional' },
    { category: 'courier', name: 'Others' },
    { category: 'city', name: 'Pollachi' },
    { category: 'city', name: 'Coimbatore' },
    { category: 'city', name: 'Chennai' },
    { category: 'city', name: 'Madurai' },
    { category: 'city', name: 'Trichy' },
    { category: 'city', name: 'Salem' },
    { category: 'city', name: 'Tirunelveli' },
    { category: 'product', name: 'Diwali Feast Box' },
    { category: 'product', name: 'Mixed Sweets Box' },
    { category: 'product', name: 'Mysore Pak Box' },
    { category: 'product', name: 'Laddu Box' },
  ];

  for (const m of mastersList) {
    await db.insert(schema.masters).values(m).onConflictDoNothing();
  }

  // 4 Sample Orders
  const sampleOrders = [
    {
      orderNo: '1001',
      customerName: 'Priya S',
      phone: '9876543210',
      address: '12 West Masi Street',
      city: 'Madurai',
      pincode: '625001',
      product: 'Diwali Feast Box',
      orderDate: '2026-10-25',
      paymentStatus: 'Paid',
      amount: '1250.00',
      status: 'Delivered',
      courier: 'DTDC',
      awbNo: 'DTDC9812401',
      weightKg: '1.50',
      boxes: 2,
      courierCharge: '120.00',
      dispatchDate: '2026-10-26',
      createdBy: owner?.id,
    },
    {
      orderNo: '1002',
      customerName: 'Arjun K',
      phone: '9845123456',
      address: '45 Cherry Road, Hasthampatti',
      city: 'Salem',
      pincode: '636007',
      product: 'Mysore Pak Box',
      orderDate: '2026-10-28',
      paymentStatus: 'Paid',
      amount: '850.00',
      status: 'In Transit',
      courier: 'ST Courier',
      awbNo: 'ST8892110',
      weightKg: '1.00',
      boxes: 1,
      courierCharge: '90.00',
      dispatchDate: '2026-10-29',
      createdBy: owner?.id,
    },
    {
      orderNo: '1003',
      customerName: 'Meena R',
      phone: '9789012345',
      address: '88 Thillai Nagar 10th Cross',
      city: 'Trichy',
      pincode: '620018',
      product: 'Mixed Sweets Box',
      orderDate: '2026-10-29',
      paymentStatus: 'COD',
      amount: '950.00',
      status: 'Delayed',
      courier: 'Professional',
      awbNo: 'PRO672314',
      weightKg: '1.20',
      boxes: 1,
      courierCharge: '95.00',
      dispatchDate: '2026-10-30',
      createdBy: owner?.id,
    },
    {
      orderNo: '1004',
      customerName: 'Karthik M',
      phone: '9944123890',
      address: '23 Gandhipuram 4th Street',
      city: 'Coimbatore',
      pincode: '641012',
      product: 'Laddu Box',
      orderDate: '2026-10-31',
      paymentStatus: 'Pending',
      amount: '650.00',
      status: 'Pending',
      courier: null,
      awbNo: null,
      weightKg: null,
      boxes: 1,
      courierCharge: null,
      dispatchDate: null,
      createdBy: owner?.id,
    },
  ];

  for (const o of sampleOrders) {
    await db.insert(schema.orders).values(o).onConflictDoNothing();
  }

  console.log('Database seeded successfully with 4 sample orders and masters!');
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
