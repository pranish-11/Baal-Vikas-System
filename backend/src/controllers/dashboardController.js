const prisma = require("../lib/prisma");

async function summary(req, res, next) {
  try {
    const { sub: userId, role } = req.user;

    if (role === "ADMIN") {
      const [totalStudents, totalTeachers, totalClassrooms, outstandingFees, todayAttendance] =
        await Promise.all([
          prisma.student.count(),
          prisma.user.count({ where: { role: "TEACHER" } }),
          prisma.classroom.count(),
          prisma.fee.count({ where: { status: "OUTSTANDING" } }),
          prisma.attendance.findMany({
            where: {
              date: {
                gte: new Date(new Date().toISOString().slice(0, 10)),
                lt: new Date(new Date(new Date().toISOString().slice(0, 10)).getTime() + 86400000),
              },
            },
          }),
        ]);

      const present = todayAttendance.filter((a) => a.status === "PRESENT").length;
      const attendanceRate = todayAttendance.length > 0 ? Math.round((present / todayAttendance.length) * 100) : 0;

      return res.json({
        role: "ADMIN",
        totalStudents,
        totalTeachers,
        totalClassrooms,
        outstandingFees,
        todayAttendanceCount: todayAttendance.length,
        attendanceRate,
      });
    }

    if (role === "TEACHER") {
      const classroom = await prisma.classroom.findUnique({
        where: { teacherId: userId },
        include: { students: true },
      });

      let todayAttendance = [];
      if (classroom) {
        const studentIds = classroom.students.map((s) => s.id);
        todayAttendance = await prisma.attendance.findMany({
          where: {
            studentId: { in: studentIds },
            date: {
              gte: new Date(new Date().toISOString().slice(0, 10)),
              lt: new Date(new Date(new Date().toISOString().slice(0, 10)).getTime() + 86400000),
            },
          },
        });
      }

      const present = todayAttendance.filter((a) => a.status === "PRESENT").length;

      return res.json({
        role: "TEACHER",
        classroomName: classroom?.name || "Not assigned",
        classroomId: classroom?.id || null,
        studentCount: classroom?.students.length || 0,
        todayPresent: present,
        todayTotal: todayAttendance.length,
      });
    }

    if (role === "PARENT") {
      const [children, fees, notifications] = await Promise.all([
        prisma.student.findMany({
          where: { parentId: userId },
          include: { classroom: true },
        }),
        prisma.fee.findMany({
          where: { parentId: userId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

      const totalFees = fees.reduce((s, f) => s + f.amount, 0);
      const totalPaid = fees.reduce((s, f) => s + f.amountPaid, 0);

      return res.json({
        role: "PARENT",
        children: children.map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          age: c.age,
          classroom: c.classroom.name,
          behaviorPoints: c.behaviorPoints,
        })),
        totalFees,
        totalPaid,
        outstandingFees: totalFees - totalPaid,
        recentNotifications: notifications,
      });
    }

    return res.json({ role, message: "Unknown role" });
  } catch (err) {
    return next(err);
  }
}

module.exports = { summary };
