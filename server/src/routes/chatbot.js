const express = require("express");
const prisma = require("../lib/prisma");
const Groq = require("groq-sdk");

const router = express.Router();

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function getWeekDates(ref) {
  const dates = [];
  const d = new Date(ref);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  for (let i = 0; i < 5; i++) {
    const wd = new Date(d);
    wd.setDate(diff + i);
    dates.push(toDateStr(wd));
  }
  return dates;
}

function buildContext(student, todayLog, activities, tags, attendanceRecords, complaints, weekDates) {
  const lines = [];

  const today = toDateStr(new Date());
  const todayAtt = attendanceRecords.find(r => r.date === today);

  lines.push(`Student: ${student.fullName || student.name}`);
  lines.push(`Today's Attendance: ${todayAtt ? todayAtt.status : 'Not marked yet'}`);
  lines.push(`Behavior Points: ${student.behaviorScore || 0}`);

  if (todayLog) {
    const acts = [];
    if (todayLog.ate) acts.push(`ate well${todayLog.ateDetails ? ' (' + todayLog.ateDetails + ')' : ''}`);
    if (todayLog.snack) acts.push(`had snack${todayLog.snackDetails ? ' (' + todayLog.snackDetails + ')' : ''}`);
    if (todayLog.nap) acts.push(`napped${todayLog.napDetails ? ' (' + todayLog.napDetails + ')' : ''}`);
    if (todayLog.play) acts.push(`played${todayLog.playDetails ? ' (' + todayLog.playDetails + ')' : ''}`);
    if (todayLog.outdoor) acts.push(`outdoor time${todayLog.outdoorDetails ? ' (' + todayLog.outdoorDetails + ')' : ''}`);
    lines.push(`Today's Activities: ${acts.join(' | ') || 'None logged'}`);
    if (todayLog.mood) lines.push(`Today's Mood: ${todayLog.mood}`);
    if (todayLog.overallRating > 0) lines.push(`Today's Rating: ${todayLog.overallRating}/5`);
    if (todayLog.learning) lines.push(`Learning: ${todayLog.learning}`);
    if (todayLog.social) lines.push(`Social: ${todayLog.social}`);
    if (todayLog.health) lines.push(`Health: ${todayLog.health}`);
    if (todayLog.note) lines.push(`Teacher Note: ${todayLog.note}`);
  }

  const weekDaysList = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const attMap = {};
  for (const r of attendanceRecords) attMap[r.date] = r.status;
  const weeklyLines = weekDates.map((d, i) => `${weekDaysList[i]}: ${attMap[d] || 'No record'}`);
  lines.push(`Weekly Attendance: ${weeklyLines.join(', ')}`);

  if (tags.length > 0) {
    lines.push(`Teacher Observations: ${tags.join('; ')}`);
  }

  if (activities.length > 0) {
    const recent = activities.slice(0, 6).map(a => `${a.title}${a.desc ? ': ' + a.desc : ''}`);
    lines.push(`Recent Activities: ${recent.join(' | ')}`);
  }

  if (complaints.length > 0) {
    lines.push(`Complaints: ${complaints.map(c => `${c.title} (${c.status})`).join('; ')}`);
  }

  return lines.join('\n');
}

router.post("/", async (req, res, next) => {
  try {
    const { question, studentId } = req.body;
    const user = req.user;
    if (!question) return res.status(400).json({ error: "Question is required" });

    let student = null;
    if (studentId) {
      student = await prisma.student.findUnique({ where: { id: studentId } });
    } else if (user?.email) {
      student = await prisma.student.findFirst({
        where: { parentEmail: { equals: user.email, mode: "insensitive" } },
      });
    }
    if (!student) {
      return res.json({
        answer: "I couldn't find a student linked to your account. Please make sure your email is linked to your child's profile.",
        suggestions: ["How do I link my child?", "Help"],
      });
    }

    const today = toDateStr(new Date());
    const weekDates = getWeekDates(new Date());
    const [activities, teacherTagsBlob, dailyLogsBlob, complaints, attendanceRecords] = await Promise.all([
      prisma.activity.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.dataBlob.findUnique({ where: { key: "axion_teacher_tags" } }),
      prisma.dataBlob.findUnique({ where: { key: "axion_daily_logs" } }),
      prisma.complaint.findMany({
        where: { filedByUserId: user.userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.attendanceRecord.findMany({
        where: { studentId: student.id, date: { in: weekDates } },
      }),
    ]);

    const dailyLogs = dailyLogsBlob ? JSON.parse(dailyLogsBlob.data) : {};
    const todayLog = dailyLogs[student.id]?.[today] || null;
    const tags = teacherTagsBlob ? (JSON.parse(teacherTagsBlob.data)?.[student.id] || []) : [];

    const studentName = student.fullName || student.name;
    const contextData = buildContext(student, todayLog, activities, tags, attendanceRecords, complaints, weekDates);

    // Build suggestions based on available data
    const sugSet = ["How is my child doing today?"];
    if (todayLog) sugSet.push("What did they eat today?");
    if (attendanceRecords.length > 0) sugSet.push("Attendance this week");
    if (activities.length > 0) sugSet.push("Behavior and points");
    if (tags.length > 0) sugSet.push("Any teacher observations?");
    if (complaints.length > 0) sugSet.push("Any concerns?");
    sugSet.push("Compare with yesterday");
    const suggestions = [...new Set(sugSet)].slice(0, 3);

    if (!groq) {
      return res.json({
        answer: `⚠️ AI assistant needs a Groq API key. Here's the data I have for **${studentName}**:\n\n${contextData}`,
        suggestions,
      });
    }

    try {
      const result = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are Axion AI, a concise assistant for parents checking on their child at daycare.

Rules:
- Get straight to the point. No greetings, no "I'm so happy to help", no filler phrases.
- Use ONLY the student data provided. Give specific facts from it.
- Keep answers short: 2-5 sentences max unless a detailed breakdown is asked for.
- Use **bold** for key info and bullet points for lists.
- If data is missing for something asked, say it briefly and move on.
- For casual messages like "hi", "yoo", etc. — respond in one short friendly line only.
- Never repeat yourself. Never pad answers.`,
          },
          {
            role: "user",
            content: `STUDENT DATA:\n${contextData}\n\n---\n\nThe parent asks: "${question}"`,
          },
        ],
        temperature: 0.4,
        max_tokens: 1024,
      });

      const answer = result.choices[0]?.message?.content || "No response.";
      res.json({ answer, suggestions });
    } catch (apiErr) {
      console.error("[Groq]", apiErr.message);
      res.json({
        answer: `Here's the data I have for **${studentName}**:\n\n${contextData}`,
        suggestions,
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
