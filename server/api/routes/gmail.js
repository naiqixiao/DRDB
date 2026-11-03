const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const oAuth2 = require("../middleware/oAuth");

const GmailController = require("../controllers/gmail");

/**
 * @swagger
 * /api/gmail/send:
 *   post:
 *     summary: Send an email via the lab's Gmail account
 *     tags: [Gmail]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - from
 *               - subject
 *               - body
 *             properties:
 *               to:
 *                 type: string
 *               from:
 *                 type: string
 *               cc:
 *                 type: string
 *               bcc:
 *                 type: string
 *               subject:
 *                 type: string
 *               body:
 *                 type: string
 *                 description: HTML body content
 *               labelNames:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Email sent
 *       500:
 *         description: Server error
 */
const labValidation = () => body("lab").isInt({ min: 1 }).withMessage("A valid lab is required.").toInt();
const reminderValidation = () => [
  labValidation(),
  body("type").isIn(require("../services/reminderPreviewService").REMINDER_SAMPLES.map(sample => sample.id)).withMessage("Choose a reminder type."),
  body("studyId").optional({ nullable: true }).isInt({ min: 1 }).toInt(),
];
router.post("/reminder-test-options", checkAuth, [labValidation()], validate, GmailController.authorizeTest, GmailController.reminderTestOptions);
router.post("/reminder-preview", checkAuth, reminderValidation(), validate, GmailController.authorizeTest, GmailController.previewReminderTest);
router.post("/send-reminder-test", checkAuth, [
  ...reminderValidation(),
  body("to").isString().bail().trim().isEmail().isLength({ max: 254 }).withMessage("Enter one valid recipient email address."),
], validate, GmailController.authorizeTest, GmailController.sendReminderTest);

router.post("/send-test", checkAuth, [
  body("lab").isInt({ min: 1 }).withMessage("A valid lab is required.").toInt(),
  body("to").isString().bail().trim().isEmail().withMessage("Enter one valid recipient email address.").isLength({ max: 254 }),
  body("subject").isString().bail().trim().isLength({ min: 1, max: 200 }).withMessage("A test subject is required (up to 200 characters)."),
  body("body").isString().bail().isLength({ min: 1, max: 50000 }).withMessage("A test message is required (up to 50,000 characters)."),
], validate, GmailController.authorizeTest, GmailController.sendTest);
router.post("/preview", checkAuth, GmailController.preview);
router.post("/send", checkAuth, oAuth2, GmailController.send);

module.exports = router;