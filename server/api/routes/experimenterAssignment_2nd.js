const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const ExperimenterAssignmentController = require("../controllers/experimenterAssignment");

router.post("/", checkAuth, ExperimenterAssignmentController.updateAppointment);

// router.post("/add", checkAuth, ExperimenterAssignmentController.create);

module.exports = router;