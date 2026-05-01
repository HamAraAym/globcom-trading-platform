import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding the GlobCom ERP database on Neon...');

  // 1. Hash the passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const repPassword = await bcrypt.hash('Rep@123', 10);

  // 2. Create the Primary Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@globcom.com' },
    update: {},
    create: {
      firstName: 'David',
      lastName: 'Chen',
      email: 'admin@globcom.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // 3. Create the Trading Team (Matches your TopBar Mock Data)
  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@globcom.com' },
    update: {},
    create: {
      firstName: 'Sarah',
      lastName: 'Jenkins',
      email: 'sarah@globcom.com',
      password: repPassword,
      role: 'TRADING_REP',
    },
  });

  const mike = await prisma.user.upsert({
    where: { email: 'mike@globcom.com' },
    update: {},
    create: {
      firstName: 'Mike',
      lastName: 'Ross',
      email: 'mike@globcom.com',
      password: repPassword,
      role: 'BUYER_REP',
    },
  });

  // 4. Create a Mock Corporate Client for the CRM
  try {
    await prisma.client.upsert({
      where: { email: 'procurement@nexuslogistics.com' },
      update: {},
      create: {
        name: 'James Harrison',
        company: 'Nexus Global Logistics',
        type: 'CORPORATE',
        email: 'procurement@nexuslogistics.com',
        phone: '+1 (555) 019-8372',
        country: 'United States',
        address: '1420 5th Ave, Seattle, WA 98101',
        kycStatus: 'VERIFIED',
        assignedRepId: sarah.id, // Assign to Sarah
      },
    });
    console.log('✅ Nexus Global Logistics (Client) created.');
  } catch (err) {
    console.log('⚠️ Skipping Client creation (schema fields may differ slightly).');
  }

  console.log('\n=========================================');
  console.log('✅ DATABASE SEEDING COMPLETE!');
  console.log('=========================================');
  console.log('You can now log in with the following accounts:');
  console.log(`🛡️  Admin: ${admin.email} | Pass: Admin@123`);
  console.log(`📈 Trader: ${sarah.email} | Pass: Rep@123`);
  console.log(`🤝 Buyer:  ${mike.email}  | Pass: Rep@123`);
  console.log('=========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });