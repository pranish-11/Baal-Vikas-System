const express = require("express");
const { listActivities, createNewActivity } = require("../controllers/activityController");

const router = express.Router();

router.get("/", listActivities);
router.post("/", createNewActivity);

module.exports = router;
