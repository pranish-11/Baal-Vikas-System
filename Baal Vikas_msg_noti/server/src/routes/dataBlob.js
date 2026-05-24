const express = require("express");
const { listAllBlobs, getBlobByKey, putBlob, removeBlob } = require("../controllers/dataBlobController");

const router = express.Router();

router.get("/", listAllBlobs);
router.get("/:key", getBlobByKey);
router.put("/:key", putBlob);
router.delete("/:key", removeBlob);

module.exports = router;
