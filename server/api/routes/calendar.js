const express = require("express");
const router = express.Router();

const CalController = require("../controllers/calendar");

router.post("/", CalController.create);

router.patch("/", CalController.update);

router.delete("/", CalController.delete);

module.exports = router;