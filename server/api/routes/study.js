const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const StudyController = require("../controllers/study");

/**
 * @swagger
 * /api/study:
 *   get:
 *     summary: Search for studies
 *     tags: [Study]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: Study ID
 *     responses:
 *       200:
 *         description: A list of studies
 *       401:
 *         description: Authentication failed
 */
router.get("/", checkAuth, StudyController.search);

/**
 * @swagger
 * /api/study/studyStats:
 *   get:
 *     summary: Get study statistics (participants per status, per recruiter, per experimenter, weekly)
 *     tags: [Study]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studyID
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the study to get stats for
 *     responses:
 *       200:
 *         description: Study statistics breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalNperStatus:
 *                   type: array
 *                   description: Participant counts grouped by schedule status
 *                 totalNperPersonnelStatus:
 *                   type: array
 *                   description: Participant counts grouped by recruiter and status
 *                 totalNperPersonnelPriExp:
 *                   type: array
 *                   description: Confirmed participants grouped by primary experimenter
 *                 totalNperPersonnelAssistExp:
 *                   type: array
 *                   description: Confirmed participants grouped by assistant experimenter
 *                 totalNWeeklyRecrtuiment:
 *                   type: array
 *                   description: Weekly recruitment numbers by status
 *       401:
 *         description: Authentication failed
 *       500:
 *         description: Server error
 */
router.get("/studyStats", checkAuth, StudyController.studyStats);

/**
 * @swagger
 * /api/study/add:
 *   post:
 *     summary: Create a new study
 *     tags: [Study]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - StudyName
 *               - FK_Lab
 *             properties:
 *               StudyName:
 *                 type: string
 *                 example: "Infant Language Study"
 *               StudyType:
 *                 type: string
 *                 example: "Behavioural"
 *               FK_Lab:
 *                 type: integer
 *                 example: 2
 *               MinAge:
 *                 type: number
 *               MaxAge:
 *                 type: number
 *     responses:
 *       200:
 *         description: Study created successfully
 *       401:
 *         description: Authentication failed
 */
router.post("/add", checkAuth, StudyController.create);

/**
 * @swagger
 * /api/study:
 *   post:
 *     summary: Update an existing study
 *     tags: [Study]
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
 *               StudyName:
 *                 type: string
 *               StudyType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Study updated successfully
 *       401:
 *         description: Authentication failed
 */
router.post("/", checkAuth, StudyController.update);

/**
 * @swagger
 * /api/study:
 *   delete:
 *     summary: Delete a study
 *     tags: [Study]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study ID to delete
 *     responses:
 *       200:
 *         description: Study deleted
 *       401:
 *         description: Authentication failed
 */
router.delete("/", checkAuth, StudyController.delete);

module.exports = router;