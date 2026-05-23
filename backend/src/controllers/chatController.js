const prisma = require("../lib/prisma");
const { chatWithParent } = require("../services/ai");

async function chat(req, res, next) {
  try {
    const { sub: userId, role } = req.user;
    if (role !== "PARENT") {
      return res.status(403).json({ error: "AI chat is available for parents only" });
    }

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "message required" });

    // Gather all context about parent's children
    const children = await prisma.student.findMany({
      where: { parentId: userId },
      include: {
        classroom: { select: { name: true } },
        attendance: { orderBy: { date: "desc" }, take: 30 },
        fees: true,
        observations: { orderBy: { date: "desc" }, take: 15 },
      },
    });

    const context = children.map((child) => {
      const totalAtt = child.attendance.length;
      const present = child.attendance.filter((a) => a.status === "PRESENT").length;
      const absent = child.attendance.filter((a) => a.status === "ABSENT").length;
      const late = child.attendance.filter((a) => a.status === "LATE").length;

      return {
        name: `${child.firstName} ${child.lastName}`,
        age: child.age,
        classroom: child.classroom.name,
        behaviorPoints: child.behaviorPoints,
        medicalNotes: child.medicalNotes || "None",
        attendance: {
          last30Days: { total: totalAtt, present, absent, late },
          rate: totalAtt > 0 ? `${Math.round((present / totalAtt) * 100)}%` : "No data",
          recentDays: child.attendance.slice(0, 7).map((a) => ({
            date: a.date.toISOString().slice(0, 10),
            status: a.status,
            note: a.note,
          })),
        },
        fees: child.fees.map((f) => ({
          title: f.title,
          amount: f.amount,
          paid: f.amountPaid,
          status: f.status,
          dueDate: f.dueDate.toISOString().slice(0, 10),
        })),
        teacherObservations: child.observations.map((o) => ({
          date: o.date.toISOString().slice(0, 10),
          tags: o.tags,
          note: o.note,
          aiSummary: o.aiSummary,
        })),
      };
    });

    const reply = await chatWithParent(message, context);
    return res.json({ reply });
  } catch (err) {
    if (err.message?.includes("API key") || err.message?.includes("not configured")) {
      return res.status(503).json({
        error: "AI service unavailable",
        reply: "I'm sorry, the AI assistant is not configured yet. Please ask your school administrator to set up the AI service.",
      });
    }
    return next(err);
  }
}

module.exports = { chat };
