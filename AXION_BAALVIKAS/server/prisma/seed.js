const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("password123", salt);
  await prisma.messageChat.deleteMany();
  await prisma.messageThread.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.school.deleteMany();

  const sunrise = await prisma.school.create({
    data: { name: "Sunrise Montessori", location: "Kathmandu", studentsCount: 23, teachersCount: 8, status: "active" },
  });

  const littleBloom = await prisma.school.create({
    data: { name: "Little Bloom Montessori", location: "Lalitpur", studentsCount: 17, teachersCount: 6, status: "active" },
  });

  await prisma.user.create({
    data: { name: "Admin User", email: "admin@axionschool.edu", passwordHash, role: "ADMIN", schoolId: sunrise.id },
  });

  const userTeacher = await prisma.user.create({
    data: { name: "Ms. Anika Roy", email: "anika.roy@axionschool.edu", passwordHash, role: "TEACHER", schoolId: sunrise.id },
  });

  const userKim = await prisma.user.create({
    data: { name: "Mrs. Kim", email: "lena.kim@parent.edu", passwordHash, role: "PARENT", schoolId: sunrise.id },
  });

  await prisma.student.createMany({
    data: [
      { fullName: "Liam Kim", className: "Sunflower Class", behaviorScore: 94, attendancePct: 96, avatarInitials: "LK", avatarColor: "var(--primary)", parentEmail: "lena@axion.edu", schoolId: sunrise.id },
      { fullName: "Noah K.", className: "Sunflower Class", behaviorScore: 88, attendancePct: 93, avatarInitials: "NK", avatarColor: "var(--sky)", schoolId: sunrise.id },
      { fullName: "Ava Singh", className: "Sunflower Class", behaviorScore: 91, attendancePct: 97, avatarInitials: "AS", avatarColor: "var(--mint)", schoolId: sunrise.id },
      { fullName: "Mila Chen", className: "Daisy Class", behaviorScore: 86, attendancePct: 95, avatarInitials: "MC", avatarColor: "var(--lavender)", schoolId: littleBloom.id },
    ],
  });

  const thread1 = await prisma.messageThread.create({
    data: {
      participantIds: [userKim.id, userTeacher.id],
      preview: "Thank you for sharing Liam's progress today!",
      timeLabel: "10:15 AM",
    },
  });

  await prisma.messageChat.createMany({
    data: [
      { threadId: thread1.id, senderId: userKim.id, text: "Hello, how did Liam do in class today?", timeLabel: "10:00 AM" },
      { threadId: thread1.id, senderId: userTeacher.id, text: "He was very focused and helped his peers.", timeLabel: "10:06 AM" },
      { threadId: thread1.id, senderId: userKim.id, text: "Thank you for sharing Liam's progress today!", timeLabel: "10:15 AM" },
    ],
  });

  await prisma.complaint.createMany({
    data: [
      {
        icon: "⚠",
        title: "Playground supervision concern",
        desc: "Parent reported delayed staff response during recess.",
        status: "OPEN",
        type: "SAFETY",
        priority: "HIGH",
        student: "Noah K.",
        by: "Parent of Noah K.",
        timeLabel: "11:03 AM",
      },
      {
        icon: "📝",
        title: "Behavior report clarification",
        desc: "Request to explain classroom incident score adjustment.",
        status: "IN_PROGRESS",
        type: "BEHAVIOR",
        priority: "MEDIUM",
        student: "Liam Kim",
        by: "Mrs. Kim",
        timeLabel: "9:20 AM",
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      { icon: "🌟", title: "Liam awarded 5 behavior points", desc: "For helping a classmate during art.", timeLabel: "9:42 AM" },
      { icon: "📸", title: "Attendance scan complete", desc: "22 of 23 students recognized.", timeLabel: "8:01 AM" },
      { icon: "💬", title: "New parent message", desc: "Mrs. Kim sent a follow-up message.", timeLabel: "10:15 AM" },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed complete.");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
