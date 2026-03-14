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

function registerJobs() {
  console.log("[Jobs] Registering scheduled tasks...");

  // ─── Reminder Emails ────────────────────────────────────────────

  // 5:00 PM — Send reminder emails to families
  cron.schedule("0 17 * * *", async () => {
    console.log(new Date().toLocaleString() + ": reminderEmail ran.");
    ReminderController.reminderEmail();
  });

  // 4:00 PM — Send reminder emails to experimenters
  cron.schedule("0 16 * * *", async () => {
    console.log(new Date().toLocaleString() + ": reminderEmailforExperimenters ran.");
    ReminderController.reminderEmailforExperimenters();
  });

  // ─── Auto Status Updates ────────────────────────────────────────

  // 9:30 AM — Auto-completion reminders
  cron.schedule("30 9 * * *", async () => {
    console.log(new Date().toLocaleString() + ": autoCompletionReminder ran.");
    ReminderController.autoCompletionReminder();
  });

  // 9:35 AM — Auto-rejection reminders
  cron.schedule("35 9 * * *", async () => {
    console.log(new Date().toLocaleString() + ": autoRejectionReminder ran.");
    ReminderController.autoRejectionReminder();
  });

  // ─── Nightly Maintenance ────────────────────────────────────────

  // 12:05 AM — Update child ages
  cron.schedule("5 0 * * *", async () => {
    console.log(new Date().toLocaleString() + ": updateAge ran.");
    ChildController.updateAge();
  });

  // 12:15 AM — Auto-completion of past appointments
  cron.schedule("15 0 * * *", async () => {
    console.log(new Date().toLocaleString() + ": autoCompletion ran.");
    autoCancelController.autoCompletion();
  });

  // 12:35 AM — Reset RTU counters
  cron.schedule("35 0 * * *", () => {
    console.log(new Date().toLocaleString() + ": RTU reset ran.");
    rtuController.reset();
  });

  // 6:00 AM — Release families whose studies are complete
  cron.schedule("0 6 * * *", async () => {
    console.log(new Date().toLocaleString() + ": releaseFamilyNew ran.");
    FamilyController.releaseFamilyNew();
  });

  // ─── Study Summaries ───────────────────────────────────────────

  // 10:46 PM — Update study appointment summaries
  cron.schedule("46 22 * * *", () => {
    console.log(new Date().toLocaleString() + ": study summaries ran.");
    AppointmentController.monthYearN();
    AppointmentController.monthYearWeekN();
  });

  console.log("[Jobs] All 8 scheduled tasks registered.");
}

module.exports = { registerJobs };
