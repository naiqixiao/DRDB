const express = require("express");
const router = express.Router();
// const checkAuth = require("../middleware/check-auth");

const ReminderController = require("../controllers/autoCancellation");


router.post("/autoCompletion", ReminderController.autoCompletion);

// router.post("/appointmentFollowUPReminder", ReminderController.autoRejectionReminder);

module.exports = router;