const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

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

function formatDate(s) {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

function wordsSimilar(a, b) {
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  if (a.length > 3 && b.length > 3) {
    const dist = levenshtein(a, b);
    if (dist <= Math.max(1, Math.floor(Math.min(a.length, b.length) / 3))) return true;
  }
  return false;
}

function parseIntent(q) {
  const raw = q.toLowerCase().trim().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const words = raw.split(" ").filter(Boolean);

  const intentDefs = [
    { intent: "attendance", keywords: ["attendance", "present", "absent", "late", "tardy", "skip", "missed", "show up", "came", "arrive", "leave"] },
    { intent: "activities", keywords: ["eat", "ate", "lunch", "snack", "nap", "slept", "play", "played", "activity", "meal", "food", "outdoor", "rest"] },
    { intent: "behavior", keywords: ["behavior", "points", "score", "rank", "conduct", "reward", "award", "deduct", "good", "bad", "nice", "discipline", "podium", "leaderboard"] },
    { intent: "observations", keywords: ["teacher", "observation", "tag", "remark", "feedback", "notice"] },
    { intent: "complaints", keywords: ["complaint", "concern", "issue", "problem", "worry", "file"] },
    { intent: "compare", keywords: ["compare", "versus", "vs", "yesterday", "better than", "worse than", "improving", "changed", "last week"] },
  ];

  const greetings = ["hi", "hello", "hey", "start", "begin"];
  const isGreeting = greetings.some(g => raw === g || raw.startsWith(g + " ") || raw.includes(" " + g));
  if (!raw) return [];
  if (isGreeting || raw === "help") return ["help"];
  if (raw.length < 3) return ["general"];

  const intents = [];
  for (const def of intentDefs) {
    let matched = false;
    for (const kw of def.keywords) {
      if (matched) break;
      if (raw.includes(kw)) { matched = true; break; }
      for (const w of words) {
        if (wordsSimilar(w, kw)) { matched = true; break; }
      }
    }
    if (matched && !intents.includes(def.intent)) intents.push(def.intent);
  }

  return intents.length > 0 ? intents : ["general"];
}

router.post("/", async (req, res, next) => {
  try {
    const { question, studentId } = req.body;
    const user = req.user;
    if (!question) return res.status(400).json({ error: "Question is required" });

    let dbUser = null;
    if (user.email) {
      dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true, name: true, email: true } });
    }

    let student = null;
    if (studentId) {
      student = await prisma.student.findUnique({ where: { id: studentId } });
    } else if (dbUser?.email) {
      student = await prisma.student.findFirst({
        where: { parentEmail: { equals: dbUser.email, mode: "insensitive" } },
      });
    }
    if (!student) {
      return res.json({ answer: "I couldn't find a student linked to your account. Please link your child first.", suggestions: ["How do I link my child?", "Help"] });
    }

    const studentName = student.fullName || student.name;
    const today = toDateStr(new Date());
    const intents = parseIntent(question);

    // Fetch all data in parallel
    const weekDates = getWeekDates(new Date());
    const [activities, teacherTagsBlob, dailyLogsBlob, complaints, attendanceRecords] = await Promise.all([
      prisma.activity.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.dataBlob.findUnique({ where: { key: "axion_teacher_tags" } }),
      prisma.dataBlob.findUnique({ where: { key: "axion_daily_logs" } }),
      prisma.complaint.findMany({
        where: { student: { contains: studentName, mode: "insensitive" } },
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

    const attMap = {};
    for (const r of attendanceRecords) attMap[r.date] = r.status;
    const weekDaysList = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const statuses = weekDates.map(d => attMap[d] || null);
    const presentCount = statuses.filter(s => s === "present").length;
    const hasAnyData = presentCount > 0 || todayLog || tags.length > 0 || activities.length > 0 || complaints.length > 0;

    const isGeneral = intents.includes("general") || intents.length === 0;

    // Help / greeting
    if (intents.includes("help")) {
      return res.json({
        answer: `Hey! I'm Axion AI. Ask me about **${studentName}** — like:\n\n- *Attendance this week?*\n- *What did they eat?*\n- *Behavior and points?*\n- *Any teacher observations?*\n\nWhat would you like to know?`,
        suggestions: ["How is my child doing?", "What did they eat?", "Attendance this week"],
      });
    }

    if (!hasAnyData) {
      return res.json({
        answer: `I don't have any data for **${studentName}** yet. Once the teacher starts logging, I'll be able to give you a full report!`,
        suggestions: ["How is my child doing?", "Attendance this week", "Behavior and points"],
      });
    }

    const lines = [];

    // ── GENERAL: concise natural summary ──
    if (isGeneral) {
      const summaryParts = [];

      // Attendance
      const todayStatus = attMap[today];
      if (todayStatus === "present") summaryParts.push("was present today");
      else if (todayStatus === "absent") summaryParts.push("was absent today");
      else if (todayStatus === "late") summaryParts.push("was late today");
      else if (presentCount > 0) summaryParts.push(`attended ${presentCount} day(s) this week`);

      // Activities & mood
      if (todayLog) {
        const acts = [];
        if (todayLog.ate) acts.push("ate");
        if (todayLog.snack) acts.push("had snack");
        if (todayLog.play) acts.push("played");
        if (todayLog.nap) acts.push("napped");
        if (todayLog.outdoor) acts.push("went outside");
        if (acts.length > 0) summaryParts.push(acts.join(", "));
        if (todayLog.mood === "happy") summaryParts.push("seemed happy");
        else if (todayLog.mood === "okay") summaryParts.push("seemed okay");
      }

      // Behavior (conversational, no exact numbers)
      const { pos, neg } = countPosNeg(activities);
      if (pos > 0 && neg === 0) summaryParts.push("earned some points today");
      else if (neg > 0 && pos === 0) summaryParts.push("points were reduced today");
      else if (pos > 0 && neg > 0) summaryParts.push("had a mixed day with points");

      if (summaryParts.length > 0) {
        lines.push(`${studentName} ${summaryParts.join(" and ")}.`);
      } else {
        lines.push(`${studentName} seems to be doing well — no recent updates to report.`);
      }

      if (tags.length > 0) {
        const tag = tags[0].length > 60 ? tags[0].slice(0, 60) + "..." : tags[0];
        lines.push(`Teacher note: "${tag}"`);
      }

      const pendingComplaints = complaints.filter(c => c.status !== "resolved");
      if (pendingComplaints.length > 0) {
        lines.push(`There ${pendingComplaints.length === 1 ? "is" : "are"} ${pendingComplaints.length} open concern(s) to check.`);
      }
    }

    // ── ATTENDANCE-SPECIFIC ──
    if (intents.includes("attendance") && !isGeneral) {
      if (statuses.some(s => s)) {
        lines.push(`Here's **${studentName}**'s attendance for this week:`);
        weekDates.forEach((d, i) => {
          const s = statuses[i];
          if (s) {
            const icon = s === "present" ? "✅" : s === "late" ? "⏰" : s === "absent" ? "❌" : "📅";
            lines.push(`- ${icon} ${weekDaysList[i]} (${formatDate(d)}): **${s.charAt(0).toUpperCase() + s.slice(1)}**`);
          } else {
            lines.push(`- ${weekDaysList[i]} (${formatDate(d)}): —`);
          }
        });
        lines.push(`On-time days: **${presentCount}**/5`);
      } else {
        lines.push(`No attendance records for **${studentName}** this week yet.`);
      }
      // Brief extra
      if (todayLog) {
        const acts = buildActivityLines(todayLog);
        if (acts.length > 0) {
          lines.push("");
          lines.push("Also today:");
          lines.push(...acts.slice(0, 2));
        }
      }
    }

    // ── ACTIVITIES-SPECIFIC ──
    if (intents.includes("activities") && !isGeneral) {
      if (todayLog) {
        const acts = buildActivityLines(todayLog);
        if (acts.length > 0) {
          lines.push(`Here's what **${studentName}** did today:`);
          lines.push(...acts);
        } else {
          lines.push(`No activities logged for **${studentName}** today yet.`);
        }
        addMoodRatingNotes(todayLog, lines);
      } else {
        lines.push(`No activities logged for **${studentName}** today yet.`);
      }
      if (statuses.some(s => s)) {
        lines.push("");
        lines.push(`Attendance this week: **${presentCount}**/5 on-time.`);
      }
    }

    // ── BEHAVIOR-SPECIFIC ──
    if (intents.includes("behavior") && !isGeneral) {
      if (isAskingForExactPoints(question)) {
        lines.push(`${studentName} has **${student.behaviorScore || 0}** points.`);
        addPosNegSummary(activities, lines);
      } else {
        const { pos, neg } = countPosNeg(activities);
        if (pos > 0 && neg === 0) {
          lines.push(`${studentName} earned some points today. 🙂`);
        } else if (neg > 0 && pos === 0) {
          lines.push(`Points were reduced today.`);
        } else if (pos > 0 && neg > 0) {
          lines.push(`${studentName} had a mixed day with points.`);
        } else {
          lines.push(`${studentName} is doing well — no recent behavior changes.`);
        }
      }
      if (tags.length > 0) {
        lines.push(`Teacher observations: ${tags.join(", ")}`);
      }
      if (todayLog?.mood) {
        const moodEmojis = { happy: "😊", okay: "😐", tired: "😴", sad: "😢", fussy: "😣" };
        lines.push(`Mood today: ${moodEmojis[todayLog.mood] || ""} ${todayLog.mood}`);
      }
    }

    // ── OBSERVATIONS-SPECIFIC ──
    if (intents.includes("observations") && !isGeneral) {
      if (tags.length > 0) {
        lines.push(`**${studentName}**'s teacher observations:`);
        tags.forEach(t => lines.push(`- 🏷️ ${t}`));
      } else {
        lines.push(`No teacher observations recorded for **${studentName}** yet.`);
      }
      if (todayLog?.note) {
        lines.push("");
        lines.push(`Latest note: *"${todayLog.note}"*`);
      }
    }

    // ── COMPLAINTS-SPECIFIC ──
    if (intents.includes("complaints") && !isGeneral) {
      if (complaints.length > 0) {
        lines.push(`**${studentName}** has ${complaints.length} complaint(s):`);
        complaints.slice(0, 3).forEach(c => {
          const si = c.status === "resolved" ? "✅" : c.status === "pending" ? "⏳" : "🆕";
          lines.push(`- ${si} ${c.title} (${c.status})`);
        });
      } else {
        lines.push(`No complaints filed for **${studentName}**.`);
      }
    }

    // ── COMPARE-SPECIFIC ──
    if (intents.includes("compare") && !isGeneral && todayLog) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = toDateStr(yesterday);
      const yLog = dailyLogs[student.id]?.[yKey];
      if (yLog) {
        lines.push(`Comparing **${studentName}**'s today vs yesterday:`);
        const countToday = [todayLog.ate, todayLog.nap, todayLog.play, todayLog.outdoor, todayLog.snack].filter(Boolean).length;
        const countYest = [yLog.ate, yLog.nap, yLog.play, yLog.outdoor, yLog.snack].filter(Boolean).length;
        if (countToday > countYest) lines.push(`- More activities today (${countToday} vs ${countYest} yesterday) 📈`);
        else if (countToday < countYest) lines.push(`- Fewer activities today (${countToday} vs ${countYest} yesterday) 📉`);
        else lines.push(`- Same activities as yesterday (${countToday})`);
        if (todayLog.mood !== yLog.mood && todayLog.mood && yLog.mood) {
          lines.push(`- Mood changed: ${yLog.mood} → ${todayLog.mood}`);
        }
      } else {
        lines.push(`No data from yesterday to compare with.`);
      }
      if (statuses.some(s => s)) {
        lines.push("");
        lines.push(`Attendance this week: **${presentCount}**/5.`);
      }
    }

    const answer = lines.join("\n") || `I don't have enough data on **${studentName}** to answer that yet. Try asking something else!`;

    const allSuggestions = ["How is my child doing?", "What did they eat?", "Attendance this week", "Behavior and points", "Any teacher observations?", "Any complaints?"];
    let suggestions;
    if (intents.includes("attendance")) {
      suggestions = ["What did they eat today?", "Behavior and points", "How is my child doing?"];
    } else if (intents.includes("activities")) {
      suggestions = ["Attendance this week", "Behavior and points", "Any teacher observations?"];
    } else if (intents.includes("behavior")) {
      suggestions = ["What did they eat today?", "Attendance this week", "Any complaints?"];
    } else if (intents.includes("observations")) {
      suggestions = ["What did they eat today?", "Behavior and points", "Compare with yesterday"];
    } else if (intents.includes("complaints")) {
      suggestions = ["How is my child doing?", "Attendance this week", "Behavior and points"];
    } else if (intents.includes("compare")) {
      suggestions = ["How is my child doing?", "Attendance this week", "What did they eat today?"];
    } else {
      const shuffled = [...allSuggestions].sort(() => Math.random() - 0.5);
      suggestions = shuffled.slice(0, 3);
    }

    res.json({ answer, suggestions });
  } catch (error) {
    next(error);
  }
});

// Helpers
function buildActivityLines(todayLog) {
  const lines = [];
  if (todayLog.ate) {
    let s = `✅ Ate meals${todayLog.ateRefused ? " (refused)" : ""}`;
    if (todayLog.ateDetails) s += ` — ${todayLog.ateDetails}`;
    if (todayLog.ateTime) s += ` @ ${todayLog.ateTime}`;
    lines.push(`- ${s}`);
  }
  if (todayLog.snack) {
    let s = `✅ Snack${todayLog.snackRefused ? " (refused)" : ""}`;
    if (todayLog.snackDetails) s += ` — ${todayLog.snackDetails}`;
    if (todayLog.snackTime) s += ` @ ${todayLog.snackTime}`;
    lines.push(`- ${s}`);
  }
  if (todayLog.nap) {
    let s = `✅ Napped`;
    if (todayLog.napDetails) s += ` — ${todayLog.napDetails}`;
    if (todayLog.napTime) s += ` @ ${todayLog.napTime}`;
    lines.push(`- ${s}`);
  }
  if (todayLog.play) {
    let s = `✅ Played`;
    if (todayLog.playDetails) s += ` — ${todayLog.playDetails}`;
    if (todayLog.playTime) s += ` @ ${todayLog.playTime}`;
    lines.push(`- ${s}`);
  }
  if (todayLog.outdoor) {
    let s = `✅ Outdoor time`;
    if (todayLog.outdoorDetails) s += ` — ${todayLog.outdoorDetails}`;
    if (todayLog.outdoorTime) s += ` @ ${todayLog.outdoorTime}`;
    lines.push(`- ${s}`);
  }
  return lines;
}

function addMoodRatingNotes(todayLog, lines) {
  if (todayLog.mood) {
    const moodEmojis = { happy: "😊", okay: "😐", tired: "😴", sad: "😢", fussy: "😣" };
    lines.push(`- Mood: ${moodEmojis[todayLog.mood] || ""} **${todayLog.mood}**`);
  }
  if (todayLog.overallRating > 0) {
    lines.push(`- Rating: ${"⭐".repeat(todayLog.overallRating)}${"☆".repeat(5 - todayLog.overallRating)}`);
  }
  if (todayLog.learning) lines.push(`- 🧠 Learning: ${todayLog.learning}`);
  if (todayLog.social) lines.push(`- 👥 Social: ${todayLog.social}`);
  if (todayLog.health) lines.push(`- ❤️ Health: ${todayLog.health}`);
  if (todayLog.note) lines.push(`- 💬 Note: *"${todayLog.note}"*`);
}

function isAskingForExactPoints(q) {
  const raw = q.toLowerCase().trim();
  const patterns = ["how many points", "how many point", "what is the score", "what's the score", "what is my", "what are my", "total points", "current points", "point total", "tell me points", "tell me the points", "exact points", "exact score"];
  return patterns.some(p => raw.includes(p));
}

function countPosNeg(activities) {
  const pos = activities.filter(a => a.title?.toLowerCase().includes("awarded")).length;
  const neg = activities.filter(a => a.title?.toLowerCase().includes("deduct")).length;
  return { pos, neg };
}

function addPosNegSummary(activities, lines) {
  const posCount = activities.filter(a => a.title?.toLowerCase().includes("awarded")).length;
  const negCount = activities.filter(a => a.title?.toLowerCase().includes("deduct")).length;
  if (posCount > 0 || negCount > 0) {
    const trend = posCount > negCount ? "📈 Mostly positive!" : negCount > posCount ? "📉 Needs improvement" : "📊 Balanced";
    lines.push(`- Recent: ${posCount} positive, ${negCount} negative — ${trend}`);
  }
}

module.exports = router;
