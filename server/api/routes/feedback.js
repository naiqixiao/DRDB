const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const FeedbackController = require("../controllers/feedback");

router.post("/", checkAuth, FeedbackController.create);

module.exports = router;