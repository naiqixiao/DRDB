const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const oAuth2 = require("../middleware/oAuth");

const ScheduleController = require("../controllers/schedule");

router.post("/add", checkAuth, ScheduleController.create);

router.get("/", checkAuth, ScheduleController.search);

router.get("/today", checkAuth, ScheduleController.today);

router.get("/week", checkAuth, ScheduleController.week);

router.post("/", checkAuth, oAuth2, ScheduleController.update);

router.delete("/", checkAuth, oAuth2, ScheduleController.delete);

module.exports = router;