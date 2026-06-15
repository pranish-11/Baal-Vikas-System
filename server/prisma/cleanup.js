const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database cleanup...\n");

  // Delete in reverse-dependency order (children before parents)
  const deletions = [
    { name: "Notification",      action: prisma.notification.deleteMany() },
    { name: "AttendanceRecord",  action: prisma.attendanceRecord.deleteMany() },
    { name: "Fee",               action: prisma.fee.deleteMany() },
    { name: "Activity",          action: prisma.activity.deleteMany() },
    { name: "ComplaintReply",    action: prisma.complaintReply.deleteMany() },
    { name: "Complaint",         action: prisma.complaint.deleteMany() },
    { name: "MessageChat",       action: prisma.messageChat.deleteMany() },
    { name: "MessageThread",     action: prisma.messageThread.deleteMany() },
    { name: "Student",           action: prisma.student.deleteMany() },
    { name: "Notice",            action: prisma.notice.deleteMany() },
    { name: "User",              action: prisma.user.deleteMany() },
    { name: "DataBlob",          action: prisma.dataBlob.deleteMany() },
    { name: "School",            action: prisma.school.deleteMany() },
  ];

  for (const { name, action } of deletions) {
    const result = await action;
    console.log(`  ${name.padEnd(20)} ${result.count} record(s) deleted`);
  }

  console.log("\nDatabase cleanup complete. All tables are empty and ready for fresh data.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Cleanup failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
