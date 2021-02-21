const express = require("express");
const router = express.Router();

const RTUController = require("../controllers/RTU");

router.get("/", RTUController.get);

router.post("/add", RTUController.add);

router.post("/remove", RTUController.remove);

module.exports = router;