const express = require("express");
const router = express.Router();
const oAuth2 = require("../middleware/oAuth");

const GmailController = require("../controllers/gmail");

/**
 * @swagger
 * /api/gmail/send:
 *   post:
 *     summary: Send an email via the lab's Gmail account
 *     tags: [Gmail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - from
 *               - subject
 *               - body
 *             properties:
 *               to:
 *                 type: string
 *               from:
 *                 type: string
 *               cc:
 *                 type: string
 *               bcc:
 *                 type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *                 description: HTML body content
 *               labelNames:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Email sent
 *       500:
 *         description: Server error
 */
router.post("/send", oAuth2, GmailController.send);

module.exports = router;