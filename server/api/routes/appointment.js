const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const AppointmentController = require("../controllers/appointment");

router.post("/add", checkAuth, AppointmentController.create);

router.post("/", checkAuth, AppointmentController.update);

router.get("/", checkAuth, AppointmentController.search);

router.delete("/", checkAuth, AppointmentController.delete);

module.exports = router;