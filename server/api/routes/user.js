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

/**
 * @swagger
 * /api/user/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Name
 *               - Email
 *               - Initial
 *               - Role
 *               - Calendar
 *             properties:
 *               Name:
 *                 type: string
 *                 example: "John Smith"
 *               Email:
 *                 type: string
 *                 example: "john@example.com"
 *               Initial:
 *                 type: string
 *                 example: "JS"
 *               Role:
 *                 type: string
 *                 enum: [Admin, PostDoc, PI, GradStudent, Undergrad, RA, Lab manager, Staff]
 *               Calendar:
 *                 type: string
 *               FK_Lab:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User created with temporary password
 *       400:
 *         description: User already exists
 */
router.post("/signup", checkAuth, oAuth2, signupValidation, validate, UserController.signup);

/**
 * @swagger
 * /api/user/signupBatch:
 *   post:
 *     summary: Batch create multiple user accounts
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Users created
 */
router.post("/signupBatch", checkAuth, oAuth2, UserController.signupBatch);

/**
 * @swagger
 * /api/user/resetPassword:
 *   post:
 *     summary: Reset a user's password (sends new password via email)
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
 *             properties:
 *               Email:
 *                 type: string
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       401:
 *         description: User not found
 */
router.post("/resetPassword", UserController.resetPassword);

/**
 * @swagger
 * /api/user/checklogin:
 *   post:
 *     summary: Verify current JWT token is still valid
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Token expired or invalid
 */
router.post("/checklogin", checkAuth, UserController.loginChecked);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Log out of the system
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", checkAuth, UserController.logout);

/**
 * @swagger
 * /api/user/changePassword:
 *   post:
 *     summary: Change user's password
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Email
 *               - Password
 *               - newPassword
 *             properties:
 *               Email:
 *                 type: string
 *               Password:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         description: Current password incorrect
 */
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
