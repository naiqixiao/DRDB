const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const FamilyController = require("../controllers/family");

router.post("/add", checkAuth, FamilyController.create);

router.post("/addBatch", checkAuth, FamilyController.batchCreate0);

router.get("/", checkAuth, FamilyController.search);

router.get("/followup", checkAuth, FamilyController.followupSearch);

// router.post("/special", checkAuth, FamilyController.changeTrainingFamilyEmail);

router.post("/releaseFamily", checkAuth, FamilyController.releaseFamilyNew);

router.post("/assignLabtoFamilies", checkAuth, FamilyController.assignLabtoFamilies);

router.post("/", checkAuth, FamilyController.update);

router.delete("/", checkAuth, FamilyController.delete);

module.exports = router;