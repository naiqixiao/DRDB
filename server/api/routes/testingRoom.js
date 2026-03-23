const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const TestingRoomController = require("../controllers/testingRoom");

/**
 * @swagger
 * /api/TestingRoom/add:
 *   post:
 *     summary: Create a new testing room
 *     tags: [Testing Room]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - FK_Lab
 *             properties:
 *               name:
 *                 type: string
 *               FK_Lab:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Testing room created
 */
router.post("/add", checkAuth, TestingRoomController.create);

/**
 * @swagger
 * /api/TestingRoom:
 *   get:
 *     summary: Search for testing rooms
 *     tags: [Testing Room]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: labId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of testing rooms
 */
router.get("/", checkAuth, TestingRoomController.search);

/**
 * @swagger
 * /api/TestingRoom:
 *   post:
 *     summary: Update a testing room
 *     tags: [Testing Room]
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Testing room updated
 */
router.post("/", checkAuth, TestingRoomController.update);

/**
 * @swagger
 * /api/TestingRoom:
 *   delete:
 *     summary: Delete a testing room
 *     tags: [Testing Room]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: testingRoomInfo
 *         required: true
 *         schema:
 *           type: string
 *         description: JSON-encoded testing room info
 *     responses:
 *       200:
 *         description: Testing room deleted
 */
router.delete("/", checkAuth, TestingRoomController.delete);

module.exports = router;