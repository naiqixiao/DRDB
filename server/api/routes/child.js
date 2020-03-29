const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const ChildController = require("../controllers/child");

router.post("/add", checkAuth, ChildController.create);

router.get("/", checkAuth, ChildController.search);

router.get("/siblings/", checkAuth, ChildController.siblings);

router.post("/", checkAuth, ChildController.update);

router.delete("/", checkAuth, ChildController.delete);

module.exports = router;