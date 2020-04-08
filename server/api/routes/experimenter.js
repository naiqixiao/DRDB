const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const ExperimenterController = require("../controllers/experimenter");

router.post("/experimenters", checkAuth, ExperimenterController.updateExperimenters);

router.post("/studies", checkAuth, ExperimenterController.updateStudies);

module.exports = router;