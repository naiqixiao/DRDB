const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const ExperimenterAssignmentController = require("../controllers/experimenterAssignment");

/**
 * @swagger
 * /api/experimentAssignment:
 *   post:
 *     summary: Update primary experimenter assignment for an appointment
 *     tags: [Experimenter Assignment]
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
 *         description: Assignment updated
 */
router.post("/", checkAuth, ExperimenterAssignmentController.updateAppointment);

// router.post("/add", checkAuth, ExperimenterAssignmentController.create);

module.exports = router;