const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const oAuth2 = require("../middleware/oAuth");
const validate = require("../middleware/validate");

const UserController = require("../controllers/user");

const VALID_ROLES = ['Admin', 'PostDoc', 'PI', 'GradStudent', 'Undergrad', 'RA', 'Lab manager', 'Staff'];

const signupValidation = [
    body("Name")
        .notEmpty().withMessage("Name is required")
        .isLength({ max: 45 }).withMessage("Name must not exceed 45 characters"),
    body("Email")
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Email must be a valid email address")
        .isLength({ max: 45 }).withMessage("Email must not exceed 45 characters"),
    body("Initial")
        .notEmpty().withMessage("Initial is required")
        .isLength({ max: 45 }).withMessage("Initial must not exceed 45 characters"),
    body("Role")
        .notEmpty().withMessage("Role is required")
        .isIn(VALID_ROLES).withMessage("Role must be one of: " + VALID_ROLES.join(", ")),
    body("Calendar")
        .notEmpty().withMessage("Calendar is required")
        .isLength({ max: 100 }).withMessage("Calendar must not exceed 100 characters"),
    body("FK_Lab")
        .optional({ values: "falsy" })
        .isInt().withMessage("FK_Lab must be an integer"),
    body("Phone")
        .optional({ values: "falsy" })
        .isLength({ max: 10 }).withMessage("Phone must not exceed 10 characters"),
];

router.post("/signup", checkAuth, oAuth2, signupValidation, validate, UserController.signup);

router.post("/signupBatch", checkAuth, oAuth2, UserController.signupBatch);

router.post("/resetPassword", UserController.resetPassword);

router.post("/checklogin", checkAuth, UserController.loginChecked);

router.post("/logout", checkAuth, UserController.logout);

router.post("/changePassword", checkAuth, UserController.changePassword);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login to the system
 *     tags: [User]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Email
 *               - Password
 *             properties:
 *               Email:
 *                 type: string
 *                 example: test@example.com
 *               Password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       401:
 *         description: Authentication failed
 */
router.post("/login", UserController.login);

module.exports = router;
