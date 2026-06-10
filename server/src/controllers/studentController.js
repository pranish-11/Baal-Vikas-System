const { getStudents, createStudent, awardPoints, updateParent, updateStudent, removeStudent, updateBehaviourScore } = require("../services/studentService");

async function listStudents(req, res, next) {
  try {
    const items = await getStudents();
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

async function createNewStudent(req, res, next) {
  try {
    const item = await createStudent(req.body);
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
}

async function awardPointsToStudent(req, res, next) {
  try {
    const item = await awardPoints(req.params.id, req.body, req.user?.userId);
    res.json({ item });
  } catch (error) {
    next(error);
  }
}

async function updateStudentParent(req, res, next) {
  try {
    const item = await updateParent(req.params.id, req.body);
    res.json({ item });
  } catch (error) {
    next(error);
  }
}

async function editStudent(req, res, next) {
  try {
    const item = await updateStudent(req.params.id, req.body);
    res.json({ item });
  } catch (error) {
    next(error);
  }
}

async function deleteStudent(req, res, next) {
  try {
    await removeStudent(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

async function updateBehaviourScoreOfStudent(req, res, next) {
  try {
    const result = await updateBehaviourScore(req.params.id, req.body.delta);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { listStudents, createNewStudent, awardPointsToStudent, updateStudentParent, editStudent, deleteStudent, updateBehaviourScoreOfStudent };
