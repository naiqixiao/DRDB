const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const oAuth2 = require("../middleware/oAuth");

const UserController = require("../controllers/user");

router.post("/signup", checkAuth, oAuth2, UserController.signup);

router.post("/signupBatch", checkAuth, oAuth2, UserController.signupBatch);

router.post("/resetPassword", UserController.resetPassword);

router.post("/checklogin", checkAuth, UserController.loginChecked);

router.post("/changePassword", checkAuth, UserController.changePassword);

router.post("/login", UserController.login);

module.exports = router;
