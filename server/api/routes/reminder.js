const express = require("express");
const router = express.Router();
// const checkAuth = require("../middleware/check-auth");

const ReminderController = require("../controllers/reminder");

router.post("/", ReminderController.reminderEmail);

module.exports = router;