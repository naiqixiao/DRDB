const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const oAuth2 = require("../middleware/oAuth");

const AppointmentController = require("../controllers/appointment");

/**
 * @swagger
 * /api/appointment/add:
 *   post:
 *     summary: Create a new appointment for a schedule
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - FK_Schedule
 *               - FK_Study
 *             properties:
 *               FK_Schedule:
 *                 type: integer
 *               FK_Study:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Appointment created
 *       401:
 *         description: Authentication failed
 */
router.post("/add", checkAuth, oAuth2, AppointmentController.create);

/**
 * @swagger
 * /api/appointment:
 *   post:
 *     summary: Update an existing appointment
 *     tags: [Appointment]
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
 *               FK_Study:
 *                 type: integer
 *               Status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated
 *       500:
 *         description: Server error
 */
router.post("/", checkAuth, oAuth2, AppointmentController.update);

/**
 * @swagger
 * /api/appointment/exp:
 *   post:
 *     summary: Update experimenters assigned to an appointment
 *     tags: [Appointment]
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
 *         description: Experimenters updated
 *       500:
 *         description: Server error
 */
router.post("/exp", checkAuth, oAuth2, AppointmentController.updateExperimenters);

/**
 * @swagger
 * /api/appointment:
 *   get:
 *     summary: Search for appointments
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: A list of appointments
 *       401:
 *         description: Authentication failed
 */
router.get("/", checkAuth, AppointmentController.search);

/**
 * @swagger
 * /api/appointment/monthYearN:
 *   get:
 *     summary: Generate monthly participant stats (Lab 2 only) and write to JSON file
 *     tags: [Appointment, Stats]
 *     security: []
 *     responses:
 *       200:
 *         description: JSON file written successfully
 *       500:
 *         description: Server error
 */
router.get("/monthYearN", AppointmentController.monthYearN);

/**
 * @swagger
 * /api/appointment/monthYearN0:
 *   get:
 *     summary: Get monthly participant stats (all labs) as JSON response
 *     tags: [Appointment, Stats]
 *     security: []
 *     responses:
 *       200:
 *         description: Monthly stats data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Year:
 *                     type: integer
 *                   Month:
 *                     type: string
 *                   YearMonth:
 *                     type: string
 *                   StudyType:
 *                     type: string
 *                   NumberOfParticipants:
 *                     type: integer
 *       500:
 *         description: Server error
 */
router.get("/monthYearN0", AppointmentController.monthYearN0);

/**
 * @swagger
 * /api/appointment/monthYearWeekN:
 *   get:
 *     summary: Generate weekday participant stats (Lab 2 only) and write to JSON file
 *     tags: [Appointment, Stats]
 *     security: []
 *     responses:
 *       200:
 *         description: JSON file written successfully
 *       500:
 *         description: Server error
 */
router.get("/monthYearWeekN", AppointmentController.monthYearWeekN);

/**
 * @swagger
 * /api/appointment:
 *   delete:
 *     summary: Delete an appointment
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Appointment ID to delete
 *     responses:
 *       200:
 *         description: Appointment deleted
 *       401:
 *         description: Authentication failed
 */
router.delete("/", checkAuth, oAuth2, AppointmentController.delete);

module.exports = router;