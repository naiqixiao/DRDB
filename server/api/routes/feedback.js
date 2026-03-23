const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const FeedbackController = require("../controllers/feedback");

/**
 * @swagger
 * /api/feedback:
 *   post:
 *     summary: Submit feedback or a bug report
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Page
 *               - Title
 *               - Body
 *             properties:
 *               Page:
 *                 type: string
 *                 example: "Schedule"
 *               Title:
 *                 type: string
 *                 example: "Calendar button not working"
 *               Body:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback submitted
 */
router.post("/", checkAuth, FeedbackController.create);

module.exports = router;