const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const oAuth2 = require("../middleware/oAuth");

const ExtController = require("../controllers/externalAPIs");

router.get("/", checkAuth, ExtController.googleCredentialsURL);

router.post("/", checkAuth, ExtController.googleToken);

router.post("/email", oAuth2, ExtController.googleEmail);

module.exports = router;