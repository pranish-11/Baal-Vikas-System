const { getActivities, createActivity } = require("../services/activityService");

async function listActivities(req, res, next) {
  try {
    const items = await getActivities();
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

async function createNewActivity(req, res, next) {
  try {
    const actorId = req.user?.userId;
    const item = await createActivity(req.body, actorId);
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
}

module.exports = { listActivities, createNewActivity };
