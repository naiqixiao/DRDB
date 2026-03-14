const express = require("express");
const router = express.Router();

const RTUController = require("../controllers/RTU");

/**
 * @swagger
 * /api/RTU:
 *   get:
 *     summary: Get all Ready-To-Use records
 *     tags: [RTU]
 *     security: []
 *     responses:
 *       200:
 *         description: A list of RTU entries
 */
router.get("/", RTUController.get);

/**
 * @swagger
 * /api/RTU/add:
 *   post:
 *     summary: Add a new RTU record
 *     tags: [RTU]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: RTU added
 */
router.post("/add", RTUController.add);

/**
 * @swagger
 * /api/RTU/remove:
 *   post:
 *     summary: Remove an RTU record
 *     tags: [RTU]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: RTU removed
 */
router.post("/remove", RTUController.remove);

module.exports = router;