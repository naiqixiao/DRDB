const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const SystemSettingController = require("../controllers/systemSetting");

router.get("/public-branding", SystemSettingController.getPublicBranding);
router.get("/branding-assets/:fileName", SystemSettingController.getBrandingAsset);
router.post("/branding-asset", checkAuth, SystemSettingController.uploadBrandingAsset);

// Only accessible by authorized users (Admin checks should be performed in controller or via role-based middleware)
router.get("/", checkAuth, SystemSettingController.getSettings);
router.post("/", checkAuth, SystemSettingController.updateSetting);

module.exports = router;
