const model = require("../models/DRDB");
const { listScheduledJobs, updateScheduledJob, TIMEZONE } = require("../../jobs/scheduler");

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

  const jobs = listScheduledJobs(personnel.FK_Lab);

  res.status(200).json({
    labId: personnel.FK_Lab,
    timezone: TIMEZONE,
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
