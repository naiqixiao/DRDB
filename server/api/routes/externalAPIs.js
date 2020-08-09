const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const oAuth2 = require("../middleware/oAuth");

const ExtController = require("../controllers/externalAPIs");

router.get("/", checkAuth, ExtController.googleCredentialsURL);

router.post("/", checkAuth, ExtController.googleToken);

router.post("/admin", checkAuth, ExtController.adminToken);

router.post("/email", checkAuth, ExtController.googleEmail);

module.exports = router;