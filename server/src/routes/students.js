const express = require("express");
const { listStudents, createNewStudent, awardPointsToStudent, updateStudentParent, editStudent, deleteStudent, updateBehaviourScoreOfStudent } = require("../controllers/studentController");
const { validate } = require("../middleware/validate");
const { studentParamSchema, createStudentSchema, awardPointsSchema, behaviourSchema } = require("../validators/studentValidators");

const router = express.Router();

router.get("/", listStudents);
router.get("/my-child", async (req, res, next) => {
  try {
    const prisma = require("../lib/prisma");
    const email = req.user?.email;
    if (!email) return res.status(400).json({ error: "No email on user" });
    const student = await prisma.student.findFirst({
      where: { parentEmail: { equals: email, mode: "insensitive" } },
    });
    if (!student) return res.json({ child: null });
    const names = student.fullName.split(" ");
    res.json({
      child: {
        id: student.id,
        name: student.fullName,
        class: student.className,
        age: student.age || 5,
        pct: student.attendancePct,
        pts: student.behaviorScore,
        parentName: student.parentName,
        parentEmail: student.parentEmail,
        init: student.avatarInitials || `${names[0]?.[0] || ""}${names[1]?.[0] || ""}`.toUpperCase(),
        bg: student.avatarColor || "var(--primary-pale)",
        col: "#2a8a6a",
        medicalNotes: student.medicalNotes,
      },
    });
  } catch (error) {
    next(error);
  }
});
router.post("/", validate(createStudentSchema, "body"), createNewStudent);
router.post("/:id/award", validate(studentParamSchema, "params"), validate(awardPointsSchema, "body"), awardPointsToStudent);
router.patch("/:id/parent", validate(studentParamSchema, "params"), updateStudentParent);
router.put("/:id", validate(studentParamSchema, "params"), editStudent);
router.delete("/:id", validate(studentParamSchema, "params"), deleteStudent);
router.patch("/:id/behaviour", validate(studentParamSchema, "params"), validate(behaviourSchema, "body"), updateBehaviourScoreOfStudent);

module.exports = router;
