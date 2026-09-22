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

/**
 * @swagger
 * /api/ai/email-polish:
 *   post:
 *     summary: Rewrite the wording of the current email draft while preserving its facts, links, and structure
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [familyId, appointmentIds, emailType, body]
 *             properties:
 *               familyId: { type: integer }
 *               appointmentIds: { type: array, items: { type: integer } }
 *               emailType: { type: string }
 *               subject: { type: string }
 *               body: { type: string, description: The current HTML email body to polish }
 *     responses:
 *       200: { description: Polished draft returned }
 *       400: { description: Invalid request }
 *       403: { description: Data or lab scope not approved }
 *       503: { description: AI provider unavailable or disabled }
 */
router.post("/email-polish", checkAuth, AiController.polishEmail);

/**
 * @swagger
 * /api/ai/family-summary:
 *   post:
 *     summary: Generate an advisory participation summary and intention-to-participate assessment for a family
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [familyId]
 *             properties:
 *               familyId: { type: integer }
 *     responses:
 *       200: { description: Family participation summary returned }
 *       400: { description: Invalid request }
 *       403: { description: Data or lab scope not approved }
 *       503: { description: AI provider unavailable or disabled }
 */
router.post("/family-summary", checkAuth, AiController.familySummary);

module.exports = router;
