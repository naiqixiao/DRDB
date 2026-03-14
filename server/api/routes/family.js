const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const checkAuth = require("../middleware/check-auth");
const validate = require("../middleware/validate");

const FamilyController = require("../controllers/family");

const familyCreateValidation = [
    body("Email")
        .optional({ values: "falsy" })
        .isEmail().withMessage("Email must be a valid email address")
        .isLength({ max: 40 }).withMessage("Email must not exceed 40 characters"),
    body("Phone")
        .optional({ values: "falsy" })
        .isLength({ max: 11 }).withMessage("Phone must not exceed 11 characters")
        .matches(/^\d+$/).withMessage("Phone must contain only digits"),
    body("CellPhone")
        .optional({ values: "falsy" })
        .isLength({ max: 11 }).withMessage("CellPhone must not exceed 11 characters")
        .matches(/^\d+$/).withMessage("CellPhone must contain only digits"),
    body("NamePrimary")
        .optional({ values: "falsy" })
        .isLength({ max: 50 }).withMessage("NamePrimary must not exceed 50 characters"),
    body("NameSecondary")
        .optional({ values: "falsy" })
        .isLength({ max: 50 }).withMessage("NameSecondary must not exceed 50 characters"),
    body("EnglishPercent")
        .optional({ values: "falsy" })
        .isInt({ min: 0, max: 100 }).withMessage("EnglishPercent must be an integer between 0 and 100"),
    body("Children")
        .optional()
        .isArray().withMessage("Children must be an array"),
    body("Children.*.Name")
        .optional({ values: "falsy" })
        .isLength({ max: 50 }).withMessage("Child name must not exceed 50 characters"),
    body("Children.*.Sex")
        .optional({ values: "falsy" })
        .isLength({ max: 1 }).withMessage("Child Sex must be a single character"),
    body("Children.*.DoB")
        .optional({ values: "falsy" })
        .isISO8601().withMessage("Child DoB must be a valid date (YYYY-MM-DD)"),
];

/**
 * @swagger
 * /api/family/add:
 *   post:
 *     summary: Create a new family with children
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               NamePrimary:
 *                 type: string
 *                 example: "Jane Doe"
 *               Email:
 *                 type: string
 *                 example: "jane.doe@example.com"
 *               Phone:
 *                 type: string
 *                 example: "9055551234"
 *               Children:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     Name:
 *                       type: string
 *                     DoB:
 *                       type: string
 *                       format: date
 *                     Sex:
 *                       type: string
 *     responses:
 *       200:
 *         description: Family created successfully
 *       401:
 *         description: Authentication failed
 */
router.post("/add", checkAuth, familyCreateValidation, validate, FamilyController.create);

/**
 * @swagger
 * /api/family/addBatch:
 *   post:
 *     summary: Batch import families from spreadsheet data
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               families:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Batch import results
 *       401:
 *         description: Authentication failed
 */
router.post("/addBatch", checkAuth, FamilyController.batchCreate0);

/**
 * @swagger
 * /api/family:
 *   get:
 *     summary: Search for families
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: Email
 *         schema:
 *           type: string
 *         description: Search by family email
 *       - in: query
 *         name: FamilyId
 *         schema:
 *           type: integer
 *         description: Search by exact family ID
 *       - in: query
 *         name: NamePrimary
 *         schema:
 *           type: string
 *         description: Search by primary caregiver name
 *       - in: query
 *         name: Phone
 *         schema:
 *           type: string
 *         description: Search by phone number
 *     responses:
 *       200:
 *         description: A list of families matching criteria
 *       401:
 *         description: Authentication failed
 */
router.get("/", checkAuth, FamilyController.search);

/**
 * @swagger
 * /api/family/followup:
 *   get:
 *     summary: Search for families needing follow-up
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Families requiring follow-up
 *       401:
 *         description: Authentication failed
 */
router.get("/followup", checkAuth, FamilyController.followupSearch);

// router.post("/special", checkAuth, FamilyController.changeTrainingFamilyEmail);

/**
 * @swagger
 * /api/family/releaseFamily:
 *   post:
 *     summary: Release a family from its assigned lab
 *     tags: [Family]
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
 *                 description: Family ID to release
 *     responses:
 *       200:
 *         description: Family released
 *       401:
 *         description: Authentication failed
 */
router.post("/releaseFamily", checkAuth, FamilyController.releaseFamilyNew);

/**
 * @swagger
 * /api/family/assignLabtoFamilies:
 *   post:
 *     summary: Assign a lab to one or more families
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               familyIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               labId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lab assigned to families
 *       401:
 *         description: Authentication failed
 */
router.post("/assignLabtoFamilies", checkAuth, FamilyController.assignLabtoFamilies);

/**
 * @swagger
 * /api/family:
 *   post:
 *     summary: Update an existing family
 *     tags: [Family]
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
 *               NamePrimary:
 *                 type: string
 *               Email:
 *                 type: string
 *               Phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Family updated
 *       401:
 *         description: Authentication failed
 */
router.post("/", checkAuth, FamilyController.update);

/**
 * @swagger
 * /api/family:
 *   delete:
 *     summary: Delete a family
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Family ID to delete
 *     responses:
 *       200:
 *         description: Family deleted
 *       401:
 *         description: Authentication failed
 */
router.delete("/", checkAuth, FamilyController.delete);

module.exports = router;