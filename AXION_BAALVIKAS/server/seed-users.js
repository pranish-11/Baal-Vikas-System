const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@axionschool.edu' },
    update: { passwordHash, role: 'ADMIN', name: 'Admin User' },
    create: {
      email: 'admin@axionschool.edu',
      passwordHash,
      role: 'ADMIN',
      name: 'Admin User'
    }
  });

  // Teacher
  await prisma.user.upsert({
    where: { email: 'anika.roy@axionschool.edu' },
    update: { passwordHash, role: 'TEACHER', name: 'Ms. Anika Roy' },
    create: {
      email: 'anika.roy@axionschool.edu',
      passwordHash,
      role: 'TEACHER',
      name: 'Ms. Anika Roy'
    }
  });

  // Parent
  await prisma.user.upsert({
    where: { email: 'lena.kim@parent.edu' },
    update: { passwordHash, role: 'PARENT', name: 'Mrs. Lena Kim' },
    create: {
      email: 'lena.kim@parent.edu',
      passwordHash,
      role: 'PARENT',
      name: 'Mrs. Lena Kim'
    }
  });

  console.log("Users seeded successfully!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
