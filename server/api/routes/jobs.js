const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const JobsController = require("../controllers/jobs");

/**
 * @swagger
 * /api/jobs/scheduled:
 *   get:
 *     summary: Get all configured backend scheduled jobs
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scheduled jobs returned
 *       403:
 *         description: Access denied for current user role
 */
router.get("/scheduled", checkAuth, JobsController.getScheduledJobs);

/**
 * @swagger
 * /api/jobs/scheduled/{jobId}:
 *   put:
 *     summary: Update an editable scheduled job (cron or enabled state)
 *     tags: [Automation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cron:
 *                 type: string
 *                 example: "0 18 * * *"
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Scheduled job updated
 *       400:
 *         description: Validation error
 *       403:
 *         description: Access denied for current user role
 *       404:
 *         description: Scheduled job not found
 */
router.put("/scheduled/:jobId", checkAuth, JobsController.updateScheduledJob);

module.exports = router;
