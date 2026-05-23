require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  const count = await prisma.user.count();
  console.log("OK: prisma connected, users=", count);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("PRISMA_FAIL:", err.message);
  console.error(err.stack);
  process.exit(1);
});
