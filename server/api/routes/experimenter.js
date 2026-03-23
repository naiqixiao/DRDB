const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const ExperimenterController = require("../controllers/experimenter");

/**
 * @swagger
 * /api/experimenter/experimenters:
 *   post:
 *     summary: Update experimenter assignments for personnel
 *     tags: [Experimenter]
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
 */
router.post("/experimenters", checkAuth, ExperimenterController.updateExperimenters);

/**
 * @swagger
 * /api/experimenter/studies:
 *   post:
 *     summary: Update study assignments for an experimenter
 *     tags: [Experimenter]
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
 *         description: Studies updated
 */
router.post("/studies", checkAuth, ExperimenterController.updateStudies);

module.exports = router;