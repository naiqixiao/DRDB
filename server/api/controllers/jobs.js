const model = require("../models/DRDB");
const { listScheduledJobs, updateScheduledJob } = require("../../jobs/scheduler");
const { getEffectiveTimezone } = require("../services/timezoneService");

const ALLOWED_ROLES = new Set(["Admin", "PI", "Lab manager"]);

async function hasAccess(req) {
  const userId = req.userData?.id;
  const personnel = await model.personnel.findByPk(userId, {
    attributes: ["Role", "Retired", "FK_Lab"],
  });

  if (!personnel || personnel.Retired || !ALLOWED_ROLES.has(personnel.Role)) {
    return null;
  }

  return personnel;
}

exports.getScheduledJobs = async (req, res) => {
  const personnel = await hasAccess(req);
  if (!personnel) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  const jobs = await listScheduledJobs(personnel.FK_Lab);
  const timezone = await getEffectiveTimezone(personnel.FK_Lab);

  res.status(200).json({
    labId: personnel.FK_Lab,
    timezone: timezone,
    count: jobs.length,
    jobs,
  });
};

exports.updateScheduledJob = async (req, res) => {
  const personnel = await hasAccess(req);
  if (!personnel) {
    return res.status(403).json({
      message: "Access denied.",
    });
  }

  const { jobId } = req.params;
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "cron")) {
    updates.cron = req.body.cron;
  }

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "enabled")) {
    updates.enabled = req.body.enabled;
  }

  try {
    const updatedJob = await updateScheduledJob(jobId, updates, personnel.FK_Lab);
    return res.status(200).json(updatedJob);
  } catch (error) {
    if (error.message === "Job not found") {
      return res.status(404).json({ message: error.message });
    }
    if (
      error.message === "Job is not editable" ||
      error.message === "Invalid cron expression" ||
      error.message === "Lab ID is required"
    ) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to update scheduled job." });
  }
};

const activityRecipientKey = (labId) => `WeeklyActivityReportRecipient_${labId}`;
const activityConfigKey = (labId) => `WeeklyActivityReportConfig_${labId}`;

exports.getActivityReportSettings = async (req, res) => {
  const personnel = await hasAccess(req);
  if (!personnel || !personnel.FK_Lab) return res.status(403).json({ message: 'Access denied.' });
  try {
    const setting = await model.systemSetting.findOne({ where: { SettingKey: activityConfigKey(personnel.FK_Lab) } });
    const legacy = setting ? null : await model.systemSetting.findOne({ where: { SettingKey: activityRecipientKey(personnel.FK_Lab) } });
    const config = setting ? JSON.parse(setting.SettingValue) : { enabled: false, recipient: legacy?.SettingValue || '' };
    return res.json({ enabled: config.enabled === true, available: true, recipient: config.recipient || '' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not load report settings.' });
  }
};

exports.updateActivityReportSettings = async (req, res) => {
  const personnel = await hasAccess(req);
  if (!personnel || !personnel.FK_Lab) return res.status(403).json({ message: 'Access denied.' });
  if (typeof req.body?.enabled !== 'boolean') return res.status(400).json({ message: 'Enabled must be true or false.' });
  const recipient = req.body?.recipient;
  if (typeof recipient !== 'string' || recipient.length > 254 ||
      (recipient.trim() && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient.trim()))) {
    return res.status(400).json({ message: 'Enter a valid email address or leave it blank.' });
  }
  try {
    const config = { enabled: req.body.enabled, recipient: recipient.trim() };
    await model.systemSetting.upsert({ SettingKey: activityConfigKey(personnel.FK_Lab), SettingValue: JSON.stringify(config) });
    return res.json({ ...config, available: true });
  } catch (error) {
    return res.status(500).json({ message: 'Could not save report settings.' });
  }
};
