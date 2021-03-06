const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const oAuth2 = require("../middleware/oAuth");

const AppointmentController = require("../controllers/appointment");

router.post("/add", checkAuth, oAuth2, AppointmentController.create);

router.post("/", checkAuth, oAuth2, AppointmentController.update);

router.post("/exp", checkAuth, oAuth2, AppointmentController.updateExperimenters);

router.get("/", checkAuth, AppointmentController.search);

router.delete("/", checkAuth, oAuth2, AppointmentController.delete);

module.exports = router;