const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const StudyController = require("../controllers/study");

router.get("/", checkAuth, StudyController.search);

router.get("/studyStats", checkAuth, StudyController.studyStats);

router.post("/add", checkAuth, StudyController.create);

router.post("/", checkAuth, StudyController.update);

router.delete("/", checkAuth, StudyController.delete);

module.exports = router;