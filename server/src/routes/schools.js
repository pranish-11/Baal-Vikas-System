const express = require("express");
const { listSchools, getSchool, createNewSchool, editSchool } = require("../controllers/schoolController");
const { validate } = require("../middleware/validate");
const { createSchoolSchema, updateSchoolSchema } = require("../validators/schoolValidators");

const router = express.Router();

router.get("/", listSchools);
router.get("/:id", getSchool);
router.post("/", validate(createSchoolSchema, "body"), createNewSchool);
router.put("/:id", validate(updateSchoolSchema, "body"), editSchool);

module.exports = router;
