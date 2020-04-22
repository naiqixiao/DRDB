const express = require("express");
const router = express.Router();
const oAuth2 = require("../middleware/oAuth");

const GmailController = require("../controllers/gmail");

router.post("/send", oAuth2, GmailController.send);

module.exports = router;