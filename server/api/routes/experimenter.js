const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const ExperimenterController = require("../controllers/experimenter");

router.post("/add", checkAuth, ExperimenterController.create);

module.exports = router;