const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const controller = require("../controllers/systemMigration");

router.get("/status", checkAuth, controller.getStatus);
router.post("/export", checkAuth, controller.exportMigration);
router.post("/import", checkAuth, controller.importMigration);

module.exports = router;
