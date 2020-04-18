const express = require("express");
const router = express.Router();

const GmailController = require("../controllers/gmail");

router.post("/send", GmailController.send);

module.exports = router;