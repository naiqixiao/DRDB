const express = require("express");
const router = express.Router();
// const checkAuth = require("../middleware/check-auth");

const ReminderController = require("../controllers/autoCancellation");

/**
 * @swagger
 * /api/auto/autoCompletion:
 *   post:
 *     summary: Auto-cancel stale appointments (cron job endpoint)
 *     tags: [Automation]
 *     security: []
 *     responses:
 *       200:
 *         description: Auto-cancellation complete
 */

router.post("/autoCompletion", ReminderController.autoCompletion);

// router.post("/appointmentFollowUPReminder", ReminderController.autoRejectionReminder);

module.exports = router;