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
  console.log('Seeding the database...');

  // Hash the password 'Admin@123'
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Upsert ensures we don't create duplicates if you run this twice
  const admin = await prisma.user.upsert({
    where: { email: 'admin@globcom.com' },
    update: {},
    create: {
      firstName: 'GlobCom',
      lastName: 'Admin',
      email: 'admin@globcom.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin user created:');
  console.log(`Email: ${admin.email}`);
  console.log(`Password: Admin@123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });