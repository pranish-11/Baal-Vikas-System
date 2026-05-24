const prisma = require("../lib/prisma");
const { notifyParent, buildAwardMessage } = require("./notificationService");

// Helper to determine text color based on background
function getTextColorForBg(bgColor) {
  const colorMap = {
    'var(--primary)': '#fff',
    'var(--primary-light)': '#fff',
    'var(--primary-pale)': 'var(--primary)',
    'var(--gold)': '#fff',
    'var(--gold-pale)': '#B07D0F',
    'var(--coral)': '#fff',
    'var(--coral-pale)': 'var(--coral)',
    'var(--sky)': '#fff',
    'var(--sky-pale)': 'var(--sky)',
    'var(--lavender)': '#fff',
    'var(--lavender-pale)': 'var(--lavender)',
    'var(--mint)': '#fff',
  };
  return colorMap[bgColor] || 'var(--primary)';
}

async function getStudents() {
  const students = await prisma.student.findMany({
    orderBy: { behaviorScore: "desc" },
  });

  return students.map((student, index) => {
    const names = student.fullName.split(" ");
    const initialA = names[0]?.[0] || "";
    const initialB = names[1]?.[0] || "";
    const bg = student.avatarColor || "var(--primary-pale)";

    return {
      id: student.id,
      name: student.fullName,
      class: student.className,
      age: student.age || 5,
      pct: student.attendancePct,
      pts: student.behaviorScore,
      rank: index + 1,
      bg,
      col: getTextColorForBg(bg),
      init: student.avatarInitials || `${initialA}${initialB}`.toUpperCase(),
      barColor: student.attendancePct >= 90 ? "var(--primary)" : "var(--sky)",
      parentName: student.parentName || null,
      parentEmail: student.parentEmail || null,
      medicalNotes: student.medicalNotes || null,
      enrollmentDate: student.enrollmentDate ? student.enrollmentDate.toISOString().split('T')[0] : null,
    };
  });
}

async function createStudent(data) {
  const initialA = data.firstName?.[0] || "";
  const initialB = data.lastName?.[0] || "";
  let schoolId = data.schoolId || null;

  if (!schoolId) {
    const fallbackSchool = await prisma.school.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    schoolId = fallbackSchool?.id || null;
  }

  const student = await prisma.student.create({
    data: {
      fullName: `${data.firstName} ${data.lastName}`,
      className: data.className,
      behaviorScore: 0,
      attendancePct: 100,
      avatarInitials: `${initialA}${initialB}`.toUpperCase(),
      avatarColor: "var(--primary-pale)",
      age: data.age || null,
      parentName: data.parentName || null,
      parentEmail: data.parentEmail || null,
      enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : null,
      medicalNotes: data.medicalNotes || null,
      schoolId,
    }
  });

  if (schoolId) {
    await prisma.school.update({
      where: { id: schoolId },
      data: { studentsCount: { increment: 1 } },
    });
  }

  const bg = student.avatarColor;
  return {
    id: student.id,
    name: student.fullName,
    class: student.className,
    age: student.age || 5,
    pct: student.attendancePct,
    pts: student.behaviorScore,
    rank: 0,
    bg,
    col: getTextColorForBg(bg),
    init: student.avatarInitials,
    barColor: "var(--primary)",
  };
}

async function awardPoints(id, data, actorId) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Student not found");
    err.statusCode = 404;
    throw err;
  }

  const student = await prisma.student.update({
    where: { id },
    data: {
      behaviorScore: {
        increment: data.points,
      },
    },
  });

  const timeLabel = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (data.description) {
    await prisma.activity.create({
      data: {
        title: `Awarded ${data.points} points to ${student.fullName}`,
        desc: data.description,
        icon: "🌟",
        timeLabel,
        studentId: id,
      },
    });
  }

  // Auto-notify parent about the points award
  let notification = { sent: false };
  if (actorId && data.description) {
    const msg = buildAwardMessage(student.fullName, data.points, data.description);
    notification = await notifyParent(id, msg, actorId);
  }

  return {
    id: student.id,
    pts: student.behaviorScore,
    notification,
  };
}

async function updateParent(id, data) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Student not found");
    err.statusCode = 404;
    throw err;
  }

  const updated = await prisma.student.update({
    where: { id },
    data: {
      parentName: data.parentName !== undefined ? (data.parentName || null) : existing.parentName,
      parentEmail: data.parentEmail !== undefined ? (data.parentEmail || null) : existing.parentEmail,
    },
  });

  return {
    id: updated.id,
    parentName: updated.parentName,
    parentEmail: updated.parentEmail,
  };
}

async function updateStudent(id, data) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Student not found");
    err.statusCode = 404;
    throw err;
  }

  const names = [data.firstName, data.lastName].filter(Boolean);
  const fullName = names.length === 2 ? `${data.firstName} ${data.lastName}` : existing.fullName;
  const initialA = (data.firstName || existing.fullName.split(' ')[0])?.[0] || '';
  const initialB = (data.lastName || existing.fullName.split(' ')[1])?.[0] || '';

  const updated = await prisma.student.update({
    where: { id },
    data: {
      fullName,
      avatarInitials: `${initialA}${initialB}`.toUpperCase(),
      className: data.className || existing.className,
      age: data.age || existing.age,
      parentName: data.parentName !== undefined ? (data.parentName || null) : existing.parentName,
      parentEmail: data.parentEmail !== undefined ? (data.parentEmail || null) : existing.parentEmail,
      enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : existing.enrollmentDate,
      medicalNotes: data.medicalNotes !== undefined ? (data.medicalNotes || null) : existing.medicalNotes,
    },
  });

  const studentNames = updated.fullName.split(' ');
  const bg = updated.avatarColor || 'var(--primary-pale)';
  return {
    id: updated.id,
    name: updated.fullName,
    class: updated.className,
    age: updated.age || 5,
    pct: updated.attendancePct,
    pts: updated.behaviorScore,
    bg,
    col: getTextColorForBg(bg),
    init: updated.avatarInitials || `${studentNames[0]?.[0] || ''}${studentNames[1]?.[0] || ''}`.toUpperCase(),
    parentName: updated.parentName,
    parentEmail: updated.parentEmail,
    medicalNotes: updated.medicalNotes,
    enrollmentDate: updated.enrollmentDate ? updated.enrollmentDate.toISOString().split('T')[0] : null,
  };
}

async function removeStudent(id) {
  const existing = await prisma.student.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Student not found");
    err.statusCode = 404;
    throw err;
  }
  await prisma.student.delete({ where: { id } });
  if (existing.schoolId) {
    await prisma.school.update({
      where: { id: existing.schoolId },
      data: { studentsCount: { decrement: 1 } },
    }).catch(() => {});
  }
}

module.exports = { getStudents, createStudent, awardPoints, updateParent, updateStudent, removeStudent };
