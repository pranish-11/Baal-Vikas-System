const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fix() {
  const parent = await prisma.user.findUnique({ where: { email: 'lena.kim@parent.edu' } });
  if (parent) {
    await prisma.classroom.updateMany({ where: { teacherId: parent.id }, data: { teacherId: null } });
    console.log('Fixed Mrs Kim classroom assignment');
  }
  await prisma.$disconnect();
}
fix();
