const { getSchools, getSchoolById, createSchool, updateSchool } = require("../services/schoolService");

async function listSchools(req, res, next) {
  try {
    const items = await getSchools();
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

async function getSchool(req, res, next) {
  try {
    const item = await getSchoolById(req.params.id);
    if (!item) return res.status(404).json({ error: "School not found" });
    res.json({ item });
  } catch (error) {
    next(error);
  }
}

async function createNewSchool(req, res, next) {
  try {
    const item = await createSchool(req.body);
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
}

async function editSchool(req, res, next) {
  try {
    const item = await updateSchool(req.params.id, req.body);
    res.json({ item });
  } catch (error) {
    next(error);
  }
}

module.exports = { listSchools, getSchool, createNewSchool, editSchool };
