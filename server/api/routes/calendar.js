const express = require("express");
const router = express.Router();

const CalController = require("../controllers/calendar");

router.post("/", CalController.create);

router.patch("/:eventId", CalController.update);

router.delete("/:eventId", CalController.delete);

module.exports = router;