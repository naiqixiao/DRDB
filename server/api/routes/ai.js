const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const AiController = require("../controllers/ai");

/**
 * @swagger
 * /api/ai/email-personalization:
 *   post:
 *     summary: Generate a reviewed personalization suggestion for a study email
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [familyId, appointmentIds, emailType]
 *             properties:
 *               familyId: { type: integer }
 *               appointmentIds: { type: array, items: { type: integer } }
 *               emailType: { type: string, enum: [Introduction, Follow-up, ThankYou] }
 *     responses:
 *       200: { description: Personalization suggestion returned }
 *       400: { description: Invalid request }
 *       403: { description: Data or lab scope not approved }
 *       503: { description: AI provider unavailable or disabled }
 */
router.post("/email-personalization", checkAuth, AiController.emailPersonalization);

module.exports = router;
