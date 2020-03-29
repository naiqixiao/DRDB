const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const LabController = require("../controllers/lab");

router.post("/add", checkAuth, LabController.create);

router.get("/", checkAuth, LabController.search);

router.post("/", checkAuth, LabController.update);

router.delete("/", checkAuth, LabController.delete);

module.exports = router;