const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const LabController = require("../controllers/lab");

/**
 * @swagger
 * /api/lab/add:
 *   post:
 *     summary: Create a new lab
 *     tags: [Lab]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - LabName
 *               - Email
 *             properties:
 *               LabName:
 *                 type: string
 *               Email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lab created
 */
router.post("/add", checkAuth, LabController.create);

/**
 * @swagger
 * /api/lab:
 *   get:
 *     summary: Search for labs
 *     tags: [Lab]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of labs
 */
router.get("/", checkAuth, LabController.search);

/**
 * @swagger
 * /api/lab:
 *   post:
 *     summary: Update a lab
 *     tags: [Lab]
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
 *               LabName:
 *                 type: string
 *               Email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lab updated
 */
router.post("/", checkAuth, LabController.update);

/**
 * @swagger
 * /api/lab:
 *   delete:
 *     summary: Delete a lab
 *     tags: [Lab]
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
 *         description: Lab deleted
 */
router.delete("/", checkAuth, LabController.delete);

module.exports = router;