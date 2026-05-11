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
  await prisma.teamMessage.deleteMany(); // ⚡ Added TeamMessage cleanup
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

  // Wipe all users to ensure a perfectly clean slate for the production accounts
  await prisma.user.deleteMany(); 

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
    where: { email: 'admin@globcom.com' }, 
    update: { password: adminPassword, role: 'ADMIN' },
    create: {
      firstName: 'Harjot',
      lastName: 'Singh',
      email: 'admin@globcom.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // The Trading Team
  const maneesh = await prisma.user.upsert({
    where: { email: 'maneesh@globcom.com' },
    update: { password: repPassword, role: 'TRADING_REP' },
    create: {
      firstName: 'Maneesh',
      lastName: 'Gupta',
      email: 'maneesh@globcom.com',
      password: repPassword,
      role: 'TRADING_REP',
    },
  });

  const hamid = await prisma.user.upsert({
    where: { email: 'hamid@globcom.com' },
    update: { password: repPassword, role: 'BUYER_REP' },
    create: {
      firstName: 'Hamid',
      lastName: 'Ibrahim',
      email: 'hamid@globcom.com',
      password: repPassword,
      role: 'BUYER_REP',
    },
  });

  console.log('\n=========================================');
  console.log('✅ DATABASE RESET & SEEDING COMPLETE!');
  console.log('=========================================');
  console.log('You can now log in with the following accounts:');
  console.log(`🛡️  Admin: ${admin.email} | Pass: Admin@123`);
  console.log(`📈 Trader: ${maneesh.email} | Pass: Rep@123`);
  console.log(`🤝 Buyer:  ${hamid.email}  | Pass: Rep@123`);
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