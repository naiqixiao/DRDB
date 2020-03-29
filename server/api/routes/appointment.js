const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const AppointmentController = require("../controllers/appointment");

router.post("/add", checkAuth, AppointmentController.create);

router.get("/", checkAuth, AppointmentController.search);

router.get("/today", checkAuth, AppointmentController.today);

router.post("/", checkAuth, AppointmentController.update);

router.delete("/", checkAuth, AppointmentController.delete);

module.exports = router;