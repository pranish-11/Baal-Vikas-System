const prisma = require("../lib/prisma");

function mapStatus(status) {
  return status.toLowerCase();
}

function mapTerm(term) {
  return term.toLowerCase().replace(/_/g, "-");
}

function mapFee(fee) {
  const balance = fee.amount - (fee.amountPaid || 0);
  return {
    id: fee.id,
    studentId: fee.studentId,
    studentName: fee.student ? fee.student.fullName : null,
    studentClass: fee.student ? fee.student.className : null,
    parentEmail: fee.student ? fee.student.parentEmail : null,
    parentName: fee.student ? fee.student.parentName : null,
    schoolId: fee.schoolId || null,
    title: fee.title,
    description: fee.description || null,
    amount: fee.amount,
    amountPaid: fee.amountPaid || 0,
    balance: Math.max(0, balance),
    term: mapTerm(fee.term),
    status: mapStatus(fee.status),
    paymentMethod: fee.paymentMethod ? fee.paymentMethod.toLowerCase().replace(/_/g, "-") : null,
    paidBy: fee.paidBy || null,
    dueDate: fee.dueDate ? fee.dueDate.toISOString().split("T")[0] : null,
    paidAt: fee.paidAt ? fee.paidAt.toISOString() : null,
    createdAt: fee.createdAt.toISOString(),
  };
}

function computeStatus(amount, amountPaid, dueDate) {
  if (amountPaid >= amount) return "PAID";
  if (amountPaid > 0) return "PARTIAL";
  if (dueDate && new Date(dueDate) < new Date()) return "OVERDUE";
  return "PENDING";
}

async function getFees(user) {
  let where = {};

  if (user.role === "PARENT") {
    const parentEmail = user.email;
    if (!parentEmail) {
      const err = new Error("Parent email not found in token.");
      err.statusCode = 400;
      throw err;
    }
    const linkedStudents = await prisma.student.findMany({
      where: { parentEmail: { equals: parentEmail, mode: "insensitive" } },
      select: { id: true },
    });
    const studentIds = linkedStudents.map((s) => s.id);
    if (studentIds.length === 0) return [];
    where = { studentId: { in: studentIds } };
  }

  const fees = await prisma.fee.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { fullName: true, className: true, parentEmail: true, parentName: true } },
    },
  });

  return fees.map(mapFee);
}

async function getFeesByStudent(studentId, user) {
  if (user.role === "PARENT") {
    const parentEmail = user.email;
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student || !parentEmail || student.parentEmail?.toLowerCase() !== parentEmail.toLowerCase()) {
      const err = new Error("Unauthorized");
      err.statusCode = 403;
      throw err;
    }
  }

  const fees = await prisma.fee.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { fullName: true, className: true, parentEmail: true, parentName: true } },
    },
  });

  return fees.map(mapFee);
}

async function createFee(data, user) {
  if (user.role === "PARENT") {
    const err = new Error("Parents cannot create fee records.");
    err.statusCode = 403;
    throw err;
  }

  const student = await prisma.student.findUnique({ where: { id: data.studentId } });
  if (!student) {
    const err = new Error("Student not found");
    err.statusCode = 404;
    throw err;
  }

  const dueDate = data.dueDate ? new Date(data.dueDate) : null;
  const status = computeStatus(data.amount, 0, dueDate);

  const fee = await prisma.fee.create({
    data: {
      studentId: data.studentId,
      schoolId: student.schoolId || null,
      title: data.title,
      description: data.description || null,
      amount: data.amount,
      amountPaid: 0,
      term: data.term || "MONTHLY",
      status,
      dueDate,
    },
    include: {
      student: { select: { fullName: true, className: true, parentEmail: true, parentName: true } },
    },
  });

  return mapFee(fee);
}

// Admin/Teacher records an offline payment (cash, cheque, bank transfer)
async function recordPayment(id, data, user) {
  if (user.role === "PARENT") {
    const err = new Error("Parents cannot record offline payments.");
    err.statusCode = 403;
    throw err;
  }

  const existing = await prisma.fee.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Fee record not found");
    err.statusCode = 404;
    throw err;
  }

  const newAmountPaid = (existing.amountPaid || 0) + data.amountPaid;
  const status = computeStatus(existing.amount, newAmountPaid, existing.dueDate);
  const paidAt = status === "PAID" ? new Date() : existing.paidAt;

  const updated = await prisma.fee.update({
    where: { id },
    data: {
      amountPaid: newAmountPaid,
      status,
      paidAt,
      paymentMethod: data.paymentMethod || "CASH",
      paidBy: user.name || user.email,
    },
    include: {
      student: { select: { fullName: true, className: true, parentEmail: true, parentName: true } },
    },
  });

  return mapFee(updated);
}

// Parent pays online — marks full balance as paid instantly
async function payOnline(id, user) {
  const existing = await prisma.fee.findUnique({
    where: { id },
    include: {
      student: { select: { fullName: true, className: true, parentEmail: true, parentName: true } },
    },
  });

  if (!existing) {
    const err = new Error("Fee record not found");
    err.statusCode = 404;
    throw err;
  }

  // Parents can only pay fees linked to their own children
  if (user.role === "PARENT") {
    const parentEmail = user.email;
    if (!existing.student.parentEmail || existing.student.parentEmail.toLowerCase() !== parentEmail.toLowerCase()) {
      const err = new Error("Unauthorized");
      err.statusCode = 403;
      throw err;
    }
  }

  if (existing.status === "PAID") {
    const err = new Error("This fee is already fully paid.");
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.fee.update({
    where: { id },
    data: {
      amountPaid: existing.amount,
      status: "PAID",
      paidAt: new Date(),
      paymentMethod: "ONLINE",
      paidBy: user.name || user.email,
    },
    include: {
      student: { select: { fullName: true, className: true, parentEmail: true, parentName: true } },
    },
  });

  return mapFee(updated);
}

async function sendReminder(id, data, user) {
  if (user.role !== "ADMIN" && user.role !== "TEACHER") {
    const err = new Error("Only admins and teachers can send fee reminders.");
    err.statusCode = 403;
    throw err;
  }

  const fee = await prisma.fee.findUnique({
    where: { id },
    include: {
      student: { select: { fullName: true, className: true, parentEmail: true, parentName: true } },
    },
  });

  if (!fee) {
    const err = new Error("Fee record not found");
    err.statusCode = 404;
    throw err;
  }

  if (!fee.student.parentEmail) {
    const err = new Error("No parent email on file for this student.");
    err.statusCode = 400;
    throw err;
  }

  const balance = fee.amount - (fee.amountPaid || 0);
  const defaultMsg = `Dear ${fee.student.parentName || "Parent"}, this is a reminder that a fee of $${balance.toFixed(2)} is outstanding for ${fee.student.fullName} (${fee.title}). Please log in to the Axion portal to pay online or contact the school.`;

  const reminderMessage = data.message || defaultMsg;
  console.log(`[FEE REMINDER] To: ${fee.student.parentEmail} | ${reminderMessage}`);

  return {
    sent: true,
    to: fee.student.parentEmail,
    studentName: fee.student.fullName,
    message: reminderMessage,
    feeTitle: fee.title,
    balance,
  };
}

async function deleteFee(id, user) {
  if (user.role !== "ADMIN") {
    const err = new Error("Only admins can delete fee records.");
    err.statusCode = 403;
    throw err;
  }

  const existing = await prisma.fee.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Fee record not found");
    err.statusCode = 404;
    throw err;
  }

  await prisma.fee.delete({ where: { id } });
}

async function getFeeSummary(user) {
  if (user.role === "PARENT") {
    const err = new Error("Unauthorized");
    err.statusCode = 403;
    throw err;
  }

  const fees = await prisma.fee.findMany({
    select: { amount: true, amountPaid: true, status: true },
  });

  const total = fees.reduce((s, f) => s + f.amount, 0);
  const collected = fees.reduce((s, f) => s + (f.amountPaid || 0), 0);
  const pending = fees.filter((f) => f.status === "PENDING").length;
  const overdue = fees.filter((f) => f.status === "OVERDUE").length;
  const paid = fees.filter((f) => f.status === "PAID").length;
  const partial = fees.filter((f) => f.status === "PARTIAL").length;

  return {
    totalAmount: total,
    collectedAmount: collected,
    outstandingAmount: total - collected,
    counts: { total: fees.length, pending, overdue, paid, partial },
  };
}

module.exports = { getFees, getFeesByStudent, createFee, recordPayment, payOnline, sendReminder, deleteFee, getFeeSummary };
