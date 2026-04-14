const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const SystemSettingController = require("../controllers/systemSetting");

// Only accessible by authorized users (Admin checks should be performed in controller or via role-based middleware)
router.get("/", checkAuth, SystemSettingController.getSettings);
router.post("/", checkAuth, SystemSettingController.updateSetting);

module.exports = router;
