const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const TestingRoomController = require("../controllers/testingRoom");

router.post("/add", checkAuth, TestingRoomController.create);

router.get("/", checkAuth, TestingRoomController.search);

// router.post("/", checkAuth, TestingRoomController.update);

// router.delete("/", checkAuth, TestingRoomController.delete);

module.exports = router;