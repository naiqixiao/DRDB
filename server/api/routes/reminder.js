const express = require("express");
const router = express.Router();
// const checkAuth = require("../middleware/check-auth");

const ReminderController = require("../controllers/reminder");

/**
 * @swagger
 * /api/reminder:
 *   post:
 *     summary: Send family reminder emails for tomorrow's appointments
 *     tags: [Reminder]
 *     security: []
 *     responses:
 *       200:
 *         description: Reminder emails sent
 */
router.post("/", ReminderController.reminderEmail);

/**
 * @swagger
 * /api/reminder/experimenterReminder:
 *   post:
 *     summary: Send reminder emails to experimenters about tomorrow's studies
 *     tags: [Reminder]
 *     security: []
 *     responses:
 *       200:
 *         description: Experimenter reminders sent
 */
router.post("/experimenterReminder", ReminderController.reminderEmailforExperimenters);

/**
 * @swagger
 * /api/reminder/studyCompletionReminder:
 *   post:
 *     summary: Send completion reminder emails to researchers
 *     tags: [Reminder]
 *     security: []
 *     responses:
 *       200:
 *         description: Completion reminders sent
 */
router.post("/studyCompletionReminder", ReminderController.autoCompletionReminder);

/**
 * @swagger
 * /api/reminder/appointmentFollowUPReminder:
 *   post:
 *     summary: Send follow-up reminder about unresolved appointments
 *     tags: [Reminder]
 *     security: []
 *     responses:
 *       200:
 *         description: Follow-up reminders sent
 */
router.post("/appointmentFollowUPReminder", ReminderController.autoRejectionReminder);

module.exports = router;