const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEMO_USERS = [
  {
    email: "admin@axionschool.edu",
    name: "Admin User",
    role: "ADMIN",
  },
  {
    email: "anika.roy@axionschool.edu",
    name: "Ms. Anika Roy",
    role: "TEACHER",
  },
  {
    email: "lena.kim@parent.edu",
    name: "Mrs. Kim",
    role: "PARENT",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        ...user,
        passwordHash,
      },
    });
  }

  console.log("Seeded 3 demo users (admin, teacher, parent). Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
