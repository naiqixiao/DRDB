const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const oAuth2 = require("../middleware/oAuth");

const ScheduleController = require("../controllers/schedule");

/**
 * @swagger
 * /api/schedule/add:
 *   post:
 *     summary: Create a new schedule (book a family for a study)
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - FK_Family
 *             properties:
 *               FK_Family:
 *                 type: integer
 *               AppointmentTime:
 *                 type: string
 *                 format: date-time
 *               Status:
 *                 type: string
 *                 enum: [TBD, Confirmed, Rescheduling, No Show, Cancelled, Rejected]
 *     responses:
 *       200:
 *         description: Schedule created
 *       401:
 *         description: Authentication failed
 */
router.post("/add", checkAuth, ScheduleController.create);

/**
 * @swagger
 * /api/schedule:
 *   get:
 *     summary: Search for schedules
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: FK_Family
 *         schema:
 *           type: integer
 *       - in: query
 *         name: Status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of schedules
 *       401:
 *         description: Authentication failed
 */
router.get("/", checkAuth, ScheduleController.search);

/**
 * @swagger
 * /api/schedule/followups:
 *   get:
 *     summary: Search for schedules needing follow-up
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Schedules needing follow-up
 */
router.get("/followups", checkAuth, ScheduleController.searchFollowUps);

/**
 * @swagger
 * /api/schedule/today:
 *   get:
 *     summary: Get today's scheduled appointments
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's schedules
 */
router.get("/today", checkAuth, ScheduleController.today);

/**
 * @swagger
 * /api/schedule/tomorrow:
 *   get:
 *     summary: Get tomorrow's scheduled appointments
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tomorrow's schedules
 */
router.get("/tomorrow", checkAuth, ScheduleController.tomorrow);

/**
 * @swagger
 * /api/schedule/week:
 *   get:
 *     summary: Get this week's scheduled appointments
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: This week's schedules
 */
router.get("/week", checkAuth, ScheduleController.week);

/**
 * @swagger
 * /api/schedule:
 *   post:
 *     summary: Update an existing schedule
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *               Status:
 *                 type: string
 *               AppointmentTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Schedule updated
 *       500:
 *         description: Server error
 */
router.post("/", checkAuth, oAuth2, ScheduleController.update);

/**
 * @swagger
 * /api/schedule/remind:
 *   post:
 *     summary: Send a reminder email to a family about their appointment
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Schedule ID
 *     responses:
 *       200:
 *         description: Reminder sent
 */
router.post("/remind", checkAuth, oAuth2, ScheduleController.remind);

/**
 * @swagger
 * /api/schedule/tyEmail:
 *   post:
 *     summary: Send a thank-you email to a family after study completion
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Schedule ID
 *     responses:
 *       200:
 *         description: Thank-you email sent
 */
router.post("/tyEmail", checkAuth, oAuth2, ScheduleController.tyEmail);

/**
 * @swagger
 * /api/schedule/complete:
 *   post:
 *     summary: Mark a schedule as completed
 *     tags: [Schedule]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Schedule marked as complete
 */
router.post("/complete", checkAuth, oAuth2, ScheduleController.complete);

/**
 * @swagger
 * /api/schedule:
 *   delete:
 *     summary: Delete a schedule and its calendar events
 *     tags: [Schedule]
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
 *         description: Schedule deleted
 */
router.delete("/", checkAuth, oAuth2, ScheduleController.delete);

/**
 * @swagger
 * /api/schedule/special:
 *   post:
 *     summary: Special schedule operations
 *     tags: [Schedule]
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
 *         description: Operation completed
 */
router.post("/special", checkAuth, ScheduleController.special);

module.exports = router;