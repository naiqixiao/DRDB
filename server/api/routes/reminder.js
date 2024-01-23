const express = require("express");
const router = express.Router();
// const checkAuth = require("../middleware/check-auth");

const ReminderController = require("../controllers/reminder");

router.post("/", ReminderController.reminderEmail);

router.post("/experimenterReminder", ReminderController.reminderEmailforExperimenters);

router.post("/studyCompletionReminder", ReminderController.autoCompletionReminder);

router.post("/appointmentFollowUPReminder", ReminderController.autoRejectionReminder);

module.exports = router;