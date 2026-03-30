/**
 * Scheduled Jobs (Cron)
 *
 * All cron jobs in one place. Called from server.js via registerJobs().
 * If running in a clustered environment (e.g. pm2 cluster mode),
 * only call registerJobs() on the primary worker to prevent duplicates.
 */

const cron = require("node-cron");
const model = require("../api/models/DRDB");

const ReminderController = require("../api/controllers/reminder");
const FamilyController = require("../api/controllers/family");
const ChildController = require("../api/controllers/child");
const autoCancelController = require("../api/controllers/autoCancellation");
const rtuController = require("../api/controllers/RTU");
const AppointmentController = require("../api/controllers/appointment");

const TIMEZONE = process.env.TIMEZONE || "America/Toronto";
const EDITABLE_JOB_IDS = new Set([
  "family-reminders",
  "experimenter-reminders",
  "auto-completion-prompt",
  "auto-rejection-prompt",
]);

const jobRuntimeConfig = new Map();
const jobHandles = new Map();

function to12HourTime(hour, minute) {
  const normalizedHour = Number(hour);
  const normalizedMinute = Number(minute);
  const period = normalizedHour >= 12 ? "PM" : "AM";
  const displayHour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  const displayMinute = String(normalizedMinute).padStart(2, "0");

  return `${displayHour}:${displayMinute} ${period}`;
}

function toHumanSchedule(cronExpression) {
  const parts = cronExpression.split(" ");

  // Supports the common "minute hour * * *" pattern used in this codebase.
  if (parts.length === 5 && parts[2] === "*" && parts[3] === "*" && parts[4] === "*") {
    return `Every day at ${to12HourTime(parts[1], parts[0])}`;
  }

  return "Custom schedule";
}

const SCHEDULED_JOBS = [
  // ─── Reminder Emails ────────────────────────────────────────────
  {
    id: "family-reminders",
    name: "Family Reminders",
    description: "Sends reminder emails to participating families.",
    cron: "0 17 * * *",
    task: (labId) => ReminderController.reminderEmail({ labId }),
  },
  {
    id: "experimenter-reminders",
    name: "Experimenter Reminders",
    description: "Sends reminder emails to assigned experimenters.",
    cron: "0 16 * * *",
    task: (labId) => ReminderController.reminderEmailforExperimenters({ labId }),
  },

  // ─── Auto Status Updates ────────────────────────────────────────
  {
    id: "auto-completion-prompt",
    name: "Auto Completion Prompt",
    description: "Reminds staff to confirm recently completed appointments.",
    cron: "30 9 * * *",
    task: (labId) => ReminderController.autoCompletionReminder({ labId }),
  },
  {
    id: "auto-rejection-prompt",
    name: "Auto Rejection Prompt",
    description: "Prompts follow-up on stale appointments that may need rejection.",
    cron: "35 9 * * *",
    task: (labId) => ReminderController.autoRejectionReminder({ labId }),
  },

  // ─── Nightly Maintenance ────────────────────────────────────────
  {
    id: "update-child-ages",
    name: "Update Child Ages",
    description: "Recalculates child ages based on date of birth.",
    cron: "5 0 * * *",
    task: () => ChildController.updateAge(),
  },
  {
    id: "past-appt-completion",
    name: "Past Appt Completion",
    description: "Marks old appointments as completed or rejected when needed.",
    cron: "15 0 * * *",
    task: () => autoCancelController.autoCompletion(),
  },
  {
    id: "reset-rtu-counters",
    name: "Reset RTU Counters",
    description: "Resets RTU counters for the next operational cycle.",
    cron: "35 0 * * *",
    task: () => rtuController.reset(),
  },
  {
    id: "release-old-families",
    name: "Release Old Families",
    description: "Releases families that are no longer actively followed.",
    cron: "0 6 * * *",
    task: () => FamilyController.releaseFamilyNew(),
  },

  // ─── Study Summaries ────────────────────────────────────────────
  {
    id: "update-study-summaries",
    name: "Update Study Summaries",
    description: "Refreshes monthly and weekly study summary metrics.",
    cron: "46 22 * * *",
    task: () => {
      AppointmentController.monthYearN();
      AppointmentController.monthYearWeekN();
    }
  }
];

function getScopedRuntimeKey(jobId, labId) {
  if (EDITABLE_JOB_IDS.has(jobId)) {
    return `lab:${labId}:${jobId}`;
  }
  return `global:${jobId}`;
}

function getScopedHandleKey(jobId, labId) {
  if (EDITABLE_JOB_IDS.has(jobId)) {
    return `lab:${labId}:${jobId}`;
  }
  return `global:${jobId}`;
}

function getDefaultRuntime(job) {
  return { cron: job.cron, enabled: true };
}

function getRuntimeForJob(job, labId) {
  const key = getScopedRuntimeKey(job.id, labId);
  return jobRuntimeConfig.get(key) || getDefaultRuntime(job);
}

function upsertRuntimeForJob(job, labId, nextConfig) {
  const key = getScopedRuntimeKey(job.id, labId);
  jobRuntimeConfig.set(key, nextConfig);
}

async function loadPersistedRuntimeConfigs(labIds) {
  await model.scheduledJobSetting.sync();

  const rows = await model.scheduledJobSetting.findAll({
    attributes: ["FK_Lab", "JobId", "CronExpression", "Enabled"],
  });

  rows.forEach((row) => {
    if (!EDITABLE_JOB_IDS.has(row.JobId)) return;
    if (!labIds.has(row.FK_Lab)) return;

    const job = findJobById(row.JobId);
    if (!job) return;

    const cronExpression =
      typeof row.CronExpression === "string" && cron.validate(row.CronExpression)
        ? row.CronExpression
        : job.cron;

    upsertRuntimeForJob(job, row.FK_Lab, {
      cron: cronExpression,
      enabled: Boolean(row.Enabled),
    });
  });
}

async function persistRuntimeForJob(job, labId, runtimeConfig) {
  const existing = await model.scheduledJobSetting.findOne({
    where: {
      FK_Lab: labId,
      JobId: job.id,
    },
  });

  if (!existing) {
    await model.scheduledJobSetting.create({
      FK_Lab: labId,
      JobId: job.id,
      CronExpression: runtimeConfig.cron,
      Enabled: runtimeConfig.enabled,
    });
    return;
  }

  await model.scheduledJobSetting.update(
    {
      CronExpression: runtimeConfig.cron,
      Enabled: runtimeConfig.enabled,
    },
    {
      where: {
        FK_Lab: labId,
        JobId: job.id,
      },
    }
  );
}

function listScheduledJobs(labId) {
  return SCHEDULED_JOBS.map((job) => {
    const runtime = getRuntimeForJob(job, labId);

    return {
      id: job.id,
      name: job.name,
      description: job.description,
      editable: EDITABLE_JOB_IDS.has(job.id),
      scope: EDITABLE_JOB_IDS.has(job.id) ? "lab" : "global",
      enabled: runtime.enabled,
      schedule: toHumanSchedule(runtime.cron),
      cron: runtime.cron,
      timezone: TIMEZONE,
    };
  });
}

function findJobById(jobId) {
  return SCHEDULED_JOBS.find((job) => job.id === jobId);
}

function unscheduleJob(jobId, labId) {
  const key = getScopedHandleKey(jobId, labId);
  const handle = jobHandles.get(key);
  if (!handle) return;

  handle.stop();
  handle.destroy();
  jobHandles.delete(key);
}

function scheduleJob(job, labId) {
  const runtime = getRuntimeForJob(job, labId);
  if (!runtime.enabled) return;

  const handleKey = getScopedHandleKey(job.id, labId);

  const executeTask = EDITABLE_JOB_IDS.has(job.id)
    ? () => job.task(labId)
    : () => job.task();

  const handle = cron.schedule(
    runtime.cron,
    async () => {
      const scopeText = EDITABLE_JOB_IDS.has(job.id) ? ` (Lab ${labId})` : "";
      console.log(`${new Date().toLocaleString()}: [CRON] Executing ${job.name}${scopeText}.`);
      try {
        await executeTask();
      } catch (error) {
        console.error(`[CRON] Error executing ${job.name}:`, error);
      }
    },
    { scheduled: true, timezone: TIMEZONE }
  );

  jobHandles.set(handleKey, handle);
}

function ensureRuntimeInitialized(job, labId) {
  const key = getScopedRuntimeKey(job.id, labId);
  if (!jobRuntimeConfig.has(key)) {
    jobRuntimeConfig.set(key, getDefaultRuntime(job));
  }
}

async function updateScheduledJob(jobId, updates = {}, labId) {
  const job = findJobById(jobId);
  if (!job) {
    throw new Error("Job not found");
  }
  if (!EDITABLE_JOB_IDS.has(job.id)) {
    throw new Error("Job is not editable");
  }

  if (!labId) {
    throw new Error("Lab ID is required");
  }

  const nextConfig = {
    ...getRuntimeForJob(job, labId),
  };

  if (Object.prototype.hasOwnProperty.call(updates, "cron")) {
    if (typeof updates.cron !== "string" || !cron.validate(updates.cron)) {
      throw new Error("Invalid cron expression");
    }
    nextConfig.cron = updates.cron;
  }

  if (Object.prototype.hasOwnProperty.call(updates, "enabled")) {
    nextConfig.enabled = Boolean(updates.enabled);
  }

  await persistRuntimeForJob(job, labId, nextConfig);
  upsertRuntimeForJob(job, labId, nextConfig);
  unscheduleJob(job.id, labId);
  // ensureRuntimeInitialized is a no-op here since we just upserted,
  // but handles the case where this lab was created after server startup
  // and has no handle yet — scheduleJob will create one.
  scheduleJob(job, labId);

  return listScheduledJobs(labId).find((scheduledJob) => scheduledJob.id === job.id);
}

async function registerJobs() {
  console.log(`[Jobs] Registering ${SCHEDULED_JOBS.length} scheduled tasks (Timezone: ${TIMEZONE})...`);

  const labs = await model.lab.findAll({ attributes: ["id"] });
  const labIds = new Set(labs.map((lab) => Number(lab.id)));
  await loadPersistedRuntimeConfigs(labIds);

  SCHEDULED_JOBS.forEach((job) => {
    if (EDITABLE_JOB_IDS.has(job.id)) {
      labs.forEach((lab) => {
        ensureRuntimeInitialized(job, lab.id);
        scheduleJob(job, lab.id);
      });
    } else {
      ensureRuntimeInitialized(job);
      scheduleJob(job);
    }
  });

  console.log("[Jobs] All scheduled tasks registered.");
}

module.exports = { registerJobs, listScheduledJobs, updateScheduledJob, TIMEZONE };
