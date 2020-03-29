const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const FamilyController = require("../controllers/family");

router.post("/add", checkAuth, FamilyController.create);

router.post("/addBatch", checkAuth, FamilyController.batchCreate);

router.get("/", checkAuth, FamilyController.search);

router.post("/", checkAuth, FamilyController.update);

router.delete("/", checkAuth, FamilyController.delete);

module.exports = router;