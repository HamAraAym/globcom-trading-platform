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
  console.log('🌱 Starting GlobCom ERP Production Reset...');

  // =========================================
  // 🧹 1. THE CLEANUP PHASE (Wipe Test Data)
  // =========================================
  console.log('🧹 Sweeping old test data...');
  
  // Note: We delete in this specific order to respect foreign key constraints
  await prisma.message.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.document.deleteMany();
  await prisma.task.deleteMany();
  await prisma.clientActivity.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  
  // Wipe the actual boards and CRM
  await prisma.demand.deleteMany();
  await prisma.supply.deleteMany();
  await prisma.client.deleteMany();

  // (Optional: Wipe all users except the ones we are about to upsert)
  // await prisma.user.deleteMany(); 

  console.log('✨ Database is clean!');

  // =========================================
  // ⚙️ 2. INITIALIZE SYSTEM SETTINGS
  // =========================================
  await prisma.systemSettings.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      companyName: 'GlobCom International FZE',
    }
  });

  // =========================================
  // 👤 3. CREATE PRODUCTION ACCOUNTS
  // =========================================
  console.log('👤 Creating team accounts...');

  const adminPassword = await bcrypt.hash('Admin@123', 10); // Change this after first login!
  const repPassword = await bcrypt.hash('Rep@123', 10);

  // The Master Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@globcom.com' }, // Feel free to change to your actual email
    update: { password: adminPassword, role: 'ADMIN' },
    create: {
      firstName: 'David',
      lastName: 'Chen',
      email: 'admin@globcom.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // The Trading Team
  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@globcom.com' },
    update: { password: repPassword, role: 'TRADING_REP' },
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
    update: { password: repPassword, role: 'BUYER_REP' },
    create: {
      firstName: 'Mike',
      lastName: 'Ross',
      email: 'mike@globcom.com',
      password: repPassword,
      role: 'BUYER_REP',
    },
  });

  console.log('\n=========================================');
  console.log('✅ DATABASE RESET & SEEDING COMPLETE!');
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