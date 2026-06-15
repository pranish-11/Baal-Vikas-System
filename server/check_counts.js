const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
(async () => {
  const models = ["School","User","Student","MessageThread","MessageChat","Complaint","ComplaintReply","Activity","Fee","AttendanceRecord","Notice","DataBlob","Notification"];
  const counts = {};
  let total = 0;
  for (const m of models) {
    const c = await prisma[m].count();
    counts[m] = c;
    total += c;
  }
  console.log(JSON.stringify(counts, null, 2));
  console.log("Total:", total, total === 0 ? "EMPTY" : "NOT EMPTY");
  await prisma.$disconnect();
})();
