const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const PersonnelController = require("../controllers/personnel");

/**
 * @swagger
 * /api/personnel/add:
 *   post:
 *     summary: Create a new personnel record
 *     tags: [Personnel]
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
 *         description: Personnel created
 */
router.post("/add", checkAuth, PersonnelController.create);

/**
 * @swagger
 * /api/personnel:
 *   get:
 *     summary: Search for personnel
 *     tags: [Personnel]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of personnel
 */
router.get("/", checkAuth, PersonnelController.search);

/**
 * @swagger
 * /api/personnel:
 *   post:
 *     summary: Update a personnel record
 *     tags: [Personnel]
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
 *         description: Personnel updated
 */
router.post("/", checkAuth, PersonnelController.update);

/**
 * @swagger
 * /api/personnel:
 *   delete:
 *     summary: Delete (retire) a personnel record
 *     tags: [Personnel]
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
 *         description: Personnel retired
 */
router.delete("/", checkAuth, PersonnelController.delete);

module.exports = router;