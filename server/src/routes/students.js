const express = require("express");
const { listStudents, createNewStudent, awardPointsToStudent, updateStudentParent, editStudent, deleteStudent } = require("../controllers/studentController");
const { validate } = require("../middleware/validate");
const { studentParamSchema, createStudentSchema, awardPointsSchema } = require("../validators/studentValidators");

const router = express.Router();

router.get("/", listStudents);
router.post("/", validate(createStudentSchema, "body"), createNewStudent);
router.post("/:id/award", validate(studentParamSchema, "params"), validate(awardPointsSchema, "body"), awardPointsToStudent);
router.patch("/:id/parent", validate(studentParamSchema, "params"), updateStudentParent);
router.put("/:id", validate(studentParamSchema, "params"), editStudent);
router.delete("/:id", validate(studentParamSchema, "params"), deleteStudent);

module.exports = router;
