const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CLASSROOMS = [
  { name: "Room 1 — Sunflower", cameraUrl: "rtsp://demo.axion.local/classroom-1" },
  { name: "Room 2 — Daisy", cameraUrl: "rtsp://demo.axion.local/classroom-2" },
  { name: "Room 3 — Lavender", cameraUrl: "rtsp://demo.axion.local/classroom-3" },
];

const STUDENTS_BY_CLASS = [
  [
    { firstName: "Liam", lastName: "Kim", age: 5 },
    { firstName: "Noah", lastName: "Karki", age: 4 },
  ],
  [
    { firstName: "Ava", lastName: "Singh", age: 5 },
    { firstName: "Mila", lastName: "Chen", age: 4 },
  ],
  [
    { firstName: "Ethan", lastName: "Rai", age: 6 },
    { firstName: "Zoe", lastName: "Thapa", age: 5 },
  ],
];

const OBS_TAGS = [
  ["focused", "eating well", "active"],
  ["social", "creative", "good listener"],
  ["curious", "energetic", "helpful"],
  ["needs support", "quiet today"],
  ["eating well", "active", "social", "creative"],
  ["focused", "good listener", "curious"],
];

const OBS_NOTES = [
  "Had a wonderful day exploring art materials. Showed great concentration during painting activity.",
  "Enjoyed group storytime and participated actively. Ate all of lunch including vegetables.",
  "Worked independently on puzzle activities. Showed patience and persistence.",
  "Was a bit quiet today during circle time but engaged well during outdoor play.",
  "Helped younger classmates with their activities. Great leadership skills today!",
  "Very curious during science exploration. Asked thoughtful questions about plants.",
  "Enjoyed music and movement activities. Ate snack and lunch well.",
  "Practiced writing letters independently. Showed good focus and fine motor skills.",
];

const STATUSES = ["PRESENT", "PRESENT", "PRESENT", "PRESENT", "ABSENT", "LATE", "PRESENT", "PRESENT"];

async function clearDomainData() {
  await prisma.notification.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.message.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.school.deleteMany();
}

async function main() {
  const teacher = await prisma.user.findUnique({ where: { email: "anika.roy@axionschool.edu" } });
  const parent = await prisma.user.findUnique({ where: { email: "lena.kim@parent.edu" } });

  if (!teacher || !parent) {
    throw new Error("Run `npm run db:seed-users` before `npm run db:seed`.");
  }

  await clearDomainData();

  const school = await prisma.school.create({
    data: {
      name: "Sunrise Montessori",
      location: "Kathmandu",
      principalName: "Dr. Priya Sharma",
      contactEmail: "office@sunrisemontessori.edu",
      phone: "+977-1-555-0100",
      address: "12 Patan Road, Lalitpur",
      notes: "Flagship campus for Axion demo data.",
    },
  });

  const admin = await prisma.user.findUnique({ where: { email: "admin@axionschool.edu" } });

  const classrooms = [];
  const teacherIds = [teacher.id, admin.id, null];
  for (let i = 0; i < CLASSROOMS.length; i += 1) {
    const classroom = await prisma.classroom.create({
      data: { ...CLASSROOMS[i], schoolId: school.id, teacherId: teacherIds[i] },
    });
    classrooms.push(classroom);
  }

  const enrollmentDate = new Date("2024-08-15T00:00:00.000Z");
  const dueDate = new Date("2025-06-30T00:00:00.000Z");
  const students = [];

  for (let c = 0; c < classrooms.length; c += 1) {
    for (const studentSeed of STUDENTS_BY_CLASS[c]) {
      const student = await prisma.student.create({
        data: {
          ...studentSeed,
          classroomId: classrooms[c].id,
          parentId: parent.id,
          enrollmentDate,
          behaviorPoints: 80 + c * 3,
        },
      });
      students.push(student);

      await prisma.fee.create({
        data: {
          studentId: student.id,
          parentId: parent.id,
          title: `Monthly Tuition — ${student.firstName} ${student.lastName}`,
          amount: 12000,
          amountPaid: student.firstName === "Liam" ? 12000 : 0,
          dueDate,
          status: student.firstName === "Liam" ? "PAID" : "OUTSTANDING",
          paidAt: student.firstName === "Liam" ? new Date() : null,
        },
      });
    }
  }

  // Seed 30 days of attendance
  const now = new Date();
  for (const student of students) {
    for (let d = 1; d <= 30; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          date,
          status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
          note: null,
          markedBy: teacher.id,
        },
      });
    }
  }

  // Seed observations (2-3 per student over last 2 weeks)
  for (const student of students) {
    const numObs = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numObs; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 4 + Math.floor(Math.random() * 3)));

      await prisma.observation.create({
        data: {
          studentId: student.id,
          teacherId: teacher.id,
          tags: OBS_TAGS[Math.floor(Math.random() * OBS_TAGS.length)],
          note: OBS_NOTES[Math.floor(Math.random() * OBS_NOTES.length)],
          date,
        },
      });
    }
  }

  // Seed some notices
  await prisma.notice.create({
    data: {
      senderId: teacher.id,
      title: "Parent-Teacher Conference Next Week",
      body: "We will be holding parent-teacher conferences on Friday. Please sign up for a time slot at the front desk.",
      targetRoles: ["PARENT"],
    },
  });

  await prisma.notice.create({
    data: {
      senderId: teacher.id,
      title: "Field Trip to Botanical Garden",
      body: "Our class will be visiting the Botanical Garden next Thursday. Please ensure your child wears comfortable shoes and brings a packed lunch.",
      targetRoles: ["PARENT"],
    },
  });

  console.log(
    `Seeded: school="${school.name}", classrooms=${classrooms.length}, students=${students.length}, fees=${students.length}, attendance=~${students.length * 22} records, observations=~${students.length * 2.5}, notices=2`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
