const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const ChildController = require("../controllers/child");

/**
 * @swagger
 * /api/child/add:
 *   post:
 *     summary: Create a new child record
 *     tags: [Child]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Name
 *               - DoB
 *               - FK_Family
 *             properties:
 *               Name:
 *                 type: string
 *                 example: "Baby Doe"
 *               DoB:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               Sex:
 *                 type: string
 *                 example: "F"
 *               FK_Family:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Child created
 *       401:
 *         description: Authentication failed
 */
router.post("/add", checkAuth, ChildController.create);

/**
 * @swagger
 * /api/child/addBatch:
 *   post:
 *     summary: Batch create multiple children
 *     tags: [Child]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               children:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Batch creation results
 */
router.post("/addBatch", checkAuth, ChildController.batchCreate);

/**
 * @swagger
 * /api/child:
 *   get:
 *     summary: Search for children
 *     tags: [Child]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: FK_Family
 *         schema:
 *           type: integer
 *         description: Filter by family ID
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         description: Child ID
 *     responses:
 *       200:
 *         description: A list of children
 */
router.get("/", checkAuth, ChildController.search);

/**
 * @swagger
 * /api/child/siblings:
 *   get:
 *     summary: Get siblings of a child
 *     tags: [Child]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: FK_Family
 *         required: true
 *         schema:
 *           type: integer
 *         description: Family ID to find siblings for
 *     responses:
 *       200:
 *         description: A list of sibling children
 */
router.get("/siblings/", checkAuth, ChildController.siblings);

/**
 * @swagger
 * /api/child:
 *   post:
 *     summary: Update a child record
 *     tags: [Child]
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
 *               Name:
 *                 type: string
 *               DoB:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Child updated
 */
router.post("/", checkAuth, ChildController.update);

/**
 * @swagger
 * /api/child/updateAge:
 *   post:
 *     summary: Recalculate and update ages for all children (cron utility)
 *     tags: [Child]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ages updated
 */
router.post("/updateAge", checkAuth, ChildController.updateAge);

/**
 * @swagger
 * /api/child:
 *   delete:
 *     summary: Delete a child record
 *     tags: [Child]
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
 *         description: Child deleted
 */
router.delete("/", checkAuth, ChildController.delete);

module.exports = router;