const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const oAuth2 = require("../middleware/oAuth");

const ExtController = require("../controllers/externalAPIs");

/**
 * @swagger
 * /api/extAPIs:
 *   get:
 *     summary: Get Google OAuth2 authorization URL
 *     tags: [External APIs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authorization URL returned
 */
router.get("/", checkAuth, ExtController.googleCredentialsURL);

/**
 * @swagger
 * /api/extAPIs:
 *   post:
 *     summary: Exchange Google OAuth2 authorization code for tokens
 *     tags: [External APIs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: OAuth2 authorization code
 *     responses:
 *       200:
 *         description: Tokens saved
 */
router.post("/", checkAuth, ExtController.googleToken);

/**
 * @swagger
 * /api/extAPIs/admin:
 *   post:
 *     summary: Exchange admin Google OAuth2 authorization code for tokens
 *     tags: [External APIs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Admin tokens saved
 */
router.post("/admin", checkAuth, ExtController.adminToken);

/**
 * @swagger
 * /api/extAPIs/email:
 *   post:
 *     summary: Exchange Google OAuth2 code for email-scope tokens
 *     tags: [External APIs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email tokens saved
 */
router.post("/email", checkAuth, ExtController.googleEmail);

module.exports = router;