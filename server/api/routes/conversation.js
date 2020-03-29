const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const ConversationController = require("../controllers/conversation");

router.post("/", checkAuth, ConversationController.create);

router.delete("/", checkAuth, ConversationController.delete);

module.exports = router;