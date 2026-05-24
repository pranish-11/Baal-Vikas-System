const { getBlob, upsertBlob, deleteBlob, listBlobs } = require("../services/dataBlobService");

async function listAllBlobs(req, res, next) {
  try {
    const items = await listBlobs();
    res.json({ items });
  } catch (error) {
    next(error);
  }
}

async function getBlobByKey(req, res, next) {
  try {
    const data = await getBlob(req.params.key);
    if (data === null) {
      res.status(404).json({ error: "Blob not found" });
      return;
    }
    res.json({ key: req.params.key, data });
  } catch (error) {
    next(error);
  }
}

async function putBlob(req, res, next) {
  try {
    const result = await upsertBlob(req.params.key, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function removeBlob(req, res, next) {
  try {
    const result = await deleteBlob(req.params.key);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { listAllBlobs, getBlobByKey, putBlob, removeBlob };
