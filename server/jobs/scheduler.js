/**
 * Scheduled Jobs (Cron)
 *
 * All cron jobs in one place. Called from server.js via registerJobs().
 * If running in a clustered environment (e.g. pm2 cluster mode),
 * only call registerJobs() on the primary worker to prevent duplicates.
 */

const cron = require("node-cron");

const ReminderController = require("../api/controllers/reminder");
const FamilyController = require("../api/controllers/family");
const ChildController = require("../api/controllers/child");
const autoCancelController = require("../api/controllers/autoCancellation");
const rtuController = require("../api/controllers/RTU");
const AppointmentController = require("../api/controllers/appointment");

const TIMEZONE = process.env.TIMEZONE || "America/Toronto";

const SCHEDULED_JOBS = [
  // ─── Reminder Emails ────────────────────────────────────────────
  { name: "Family Reminders",       cron: "0 17 * * *",  task: () => ReminderController.reminderEmail() },
  { name: "Experimenter Reminders", cron: "0 16 * * *",  task: () => ReminderController.reminderEmailforExperimenters() },

  // ─── Auto Status Updates ────────────────────────────────────────
  { name: "Auto Completion Prompt", cron: "30 9 * * *",  task: () => ReminderController.autoCompletionReminder() },
  { name: "Auto Rejection Prompt",  cron: "35 9 * * *",  task: () => ReminderController.autoRejectionReminder() },

  // ─── Nightly Maintenance ────────────────────────────────────────
  { name: "Update Child Ages",      cron: "5 0 * * *",   task: () => ChildController.updateAge() },
  { name: "Past Appt Completion",   cron: "15 0 * * *",  task: () => autoCancelController.autoCompletion() },
  { name: "Reset RTU Counters",     cron: "35 0 * * *",  task: () => rtuController.reset() },
  { name: "Release Old Families",   cron: "0 6 * * *",   task: () => FamilyController.releaseFamilyNew() },

  // ─── Study Summaries ────────────────────────────────────────────
  {
    name: "Update Study Summaries",
    cron: "46 22 * * *",
    task: () => {
      AppointmentController.monthYearN();
      AppointmentController.monthYearWeekN();
    }
  }
];

function registerJobs() {
  console.log(`[Jobs] Registering ${SCHEDULED_JOBS.length} scheduled tasks (Timezone: ${TIMEZONE})...`);

  SCHEDULED_JOBS.forEach((job) => {
    cron.schedule(
      job.cron,
      async () => {
        console.log(`${new Date().toLocaleString()}: [CRON] Executing ${job.name}.`);
        try {
          await job.task();
        } catch (error) {
          console.error(`[CRON] Error executing ${job.name}:`, error);
        }
      },
      { scheduled: true, timezone: TIMEZONE }
    );
  });

  console.log("[Jobs] All scheduled tasks registered.");
}

module.exports = { registerJobs };
