const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const UserController = require("../controllers/user");

router.post("/signup", checkAuth, UserController.signup);

router.post("/login", UserController.login);

module.exports = router;
