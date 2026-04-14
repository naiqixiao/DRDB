const model = require("../models/DRDB");
const asyncHandler = require("express-async-handler");
const { reloadAllJobs } = require("../../jobs/scheduler");

// Get all system settings (or specific one)
exports.getSettings = asyncHandler(async (req, res) => {
  const { key } = req.query;
  const where = key ? { SettingKey: key } : {};
  
  const settings = await model.systemSetting.findAll({ where });
  
  if (key && settings.length === 0) {
    return res.status(200).json(null);
  }
  
  res.status(200).json(key ? settings[0] : settings);
});

// Upsert a system setting
exports.updateSetting = asyncHandler(async (req, res) => {
  const { SettingKey, SettingValue } = req.body;
  
  if (!SettingKey) {
    return res.status(400).json({ message: "SettingKey is required." });
  }

  const [setting, created] = await model.systemSetting.findOrCreate({
    where: { SettingKey },
    defaults: { SettingValue }
  });

  if (!created) {
    await setting.update({ SettingValue });
  }

  // If the general timezone was updated, reload all jobs
  if (SettingKey === "GeneralTimezone") {
    await reloadAllJobs();
  }

  res.status(200).json(setting);
});
