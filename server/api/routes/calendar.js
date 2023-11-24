const express = require("express");
const router = express.Router();
const oAuth2 = require("../middleware/oAuth");

const CalController = require("../controllers/calendar");

router.post("/", oAuth2, CalController.create);

router.patch("/", oAuth2, CalController.update);

router.delete("/", oAuth2, CalController.delete);

router.post('/createSecondaryCalendar', oAuth2, CalController.createSecondaryCalendar);

module.exports = router;