const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const ConversationController = require("../controllers/conversation");

/**
 * @swagger
 * /api/conversation:
 *   post:
 *     summary: Create a conversation log entry for a family
 *     tags: [Conversation]
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
 *         description: Conversation created
 */
router.post("/", checkAuth, ConversationController.create);

/**
 * @swagger
 * /api/conversation:
 *   delete:
 *     summary: Delete a conversation log entry
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversation deleted
 */
router.delete("/", checkAuth, ConversationController.delete);

module.exports = router;