const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const ScheduleController = require("../controllers/schedule");

router.post("/add", checkAuth, ScheduleController.create);

router.get("/", checkAuth, ScheduleController.search);

router.get("/today", checkAuth, ScheduleController.today);

router.get("/week", checkAuth, ScheduleController.week);

router.post("/", checkAuth, ScheduleController.update);

router.delete("/", checkAuth, ScheduleController.delete);

module.exports = router;