const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const ExtController = require("../controllers/externalAPIs");

router.get("/", checkAuth, ExtController.googleCredentialsURL);

router.post("/", checkAuth, ExtController.googleToken);

module.exports = router;