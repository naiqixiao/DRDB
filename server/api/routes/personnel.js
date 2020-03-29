const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const PersonnelController = require("../controllers/personnel");

router.post("/add", checkAuth, PersonnelController.create);

router.get("/", checkAuth, PersonnelController.search);

router.post("/", checkAuth, PersonnelController.update);

router.delete("/", checkAuth, PersonnelController.delete);

module.exports = router;