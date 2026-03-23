const express = require("express");
const router = express.Router();
const oAuth2 = require("../middleware/oAuth");

const CalController = require("../controllers/calendar");

/**
 * @swagger
 * /api/cal:
 *   post:
 *     summary: Create a Google Calendar event
 *     tags: [Calendar]
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
 *         description: Calendar event created
 *       500:
 *         description: Server error
 */
router.post("/", oAuth2, CalController.create);

/**
 * @swagger
 * /api/cal:
 *   patch:
 *     summary: Update a Google Calendar event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *               calendarId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Calendar event updated
 *       500:
 *         description: Server error
 */
router.patch("/", oAuth2, CalController.update);

/**
 * @swagger
 * /api/cal:
 *   delete:
 *     summary: Delete a Google Calendar event
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: calendarId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Calendar event deleted
 *       500:
 *         description: Server error
 */
router.delete("/", oAuth2, CalController.delete);

/**
 * @swagger
 * /api/cal/createSecondaryCalendar:
 *   post:
 *     summary: Create a secondary Google Calendar for a lab
 *     tags: [Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Secondary calendar created
 */
router.post('/createSecondaryCalendar', oAuth2, CalController.createSecondaryCalendar);

module.exports = router;