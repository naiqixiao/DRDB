const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const asyncHandler = require("express-async-handler");
const { sendAdminEmail } = require("../utils/emailUtil");
const {
  buildCompletionReminderBody,
  buildRejectionReminderBody,
  buildExperimenterReminderBody,
} = require("../utils/reminderTemplates");

const { MOCK, mockScheduleForFamily, mockScheduleList, mockExperimenter } = require("../utils/reminderPreviewFixtures");

/**
 * Build mock for account-level emails using the REAL template builders.
 */
function mockAccountEmail(type) {
  const {
    buildWelcomeEmail,
    buildPasswordChangedEmail,
    buildPasswordResetEmail,
    buildFeedbackEmail,
  } = require("../utils/userTemplates");

  switch (type) {
    case "lab-welcome":
    case "user-signup": {
      const email = buildWelcomeEmail(
        MOCK.experimenterName,
        MOCK.experimenterEmail,
        MOCK.role,
        MOCK.password
      );
      email.description =
        type === "lab-welcome"
          ? "Rendered by userTemplates.buildWelcomeEmail() — used by labService.createLab()."
          : "Rendered by userTemplates.buildWelcomeEmail() — used by user.js signup/signupBatch.";
      return email;
    }

    case "password-changed": {
      const email = buildPasswordChangedEmail(
        MOCK.experimenterName,
        MOCK.experimenterEmail
      );
      email.description =
        "Rendered by userTemplates.buildPasswordChangedEmail() — used by user.js changePassword.";
      return email;
    }

    case "password-reset": {
      const email = buildPasswordResetEmail(
        MOCK.experimenterName,
        MOCK.experimenterEmail,
        MOCK.password
      );
      email.description =
        "Rendered by userTemplates.buildPasswordResetEmail() — used by user.js resetPassword.";
      return email;
    }

    case "feedback": {
      const email = buildFeedbackEmail(
        MOCK.experimenterEmail,
        "Schedule",
        "Calendar button not working on Firefox",
        "When I click the 'Add to Calendar' button on the Schedule page using Firefox 120, nothing happens."
      );
      email.description =
        "Rendered by userTemplates.buildFeedbackEmail() — used by feedback.js.";
      return email;
    }

    default:
      return null;
  }
}


// ─── Template catalog ─────────────────────────────────────────────
const TEMPLATE_CATALOG = [
  // Account / User group
  { id: "lab-welcome", group: "Account & User", label: "Lab Welcome", icon: "mdi-flask-outline" },
  { id: "user-signup", group: "Account & User", label: "User Signup", icon: "mdi-account-plus-outline" },
  { id: "password-changed", group: "Account & User", label: "Password Changed", icon: "mdi-lock-check-outline" },
  { id: "password-reset", group: "Account & User", label: "Password Reset", icon: "mdi-lock-reset" },
  { id: "feedback", group: "Account & User", label: "Feedback", icon: "mdi-message-alert-outline" },
  // Reminder group
  { id: "family-reminder", group: "Reminders", label: "Family Reminder", icon: "mdi-calendar-alert" },
  { id: "manual-reminder", group: "Reminders", label: "Manual Reminder (No Email)", icon: "mdi-phone-alert" },
  { id: "completion-reminder", group: "Reminders", label: "Completion Reminder", icon: "mdi-clipboard-check-outline" },
  { id: "rejection-reminder", group: "Reminders", label: "Follow-Up Reminder", icon: "mdi-clock-alert-outline" },
  { id: "experimenter-reminder", group: "Reminders", label: "Experimenter Reminder", icon: "mdi-account-clock-outline" },
];

// ─── Routes ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/emailTest/templates:
 *   get:
 *     summary: Get list of available email template IDs
 *     tags: [Email Test]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Template catalog returned
 */
router.get(
  "/templates",
  checkAuth,
  asyncHandler(async (req, res) => {
    res.json(TEMPLATE_CATALOG);
  })
);

/**
 * @swagger
 * /api/emailTest/render/{templateId}:
 *   get:
 *     summary: Render a specific email template with mock data
 *     tags: [Email Test]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID (e.g., family-reminder, user-signup)
 *     responses:
 *       200:
 *         description: Rendered email HTML returned
 *       404:
 *         description: Unknown template ID
 */
router.get(
  "/render/:templateId",
  checkAuth,
  asyncHandler(async (req, res) => {
    const { templateId } = req.params;

    // Import the family/manual builders here (they need the full schedule object)
    const {
      buildFamilyReminderBody,
      buildManualReminderBody,
    } = require("../utils/reminderTemplates");

    let result;

    switch (templateId) {
      // ─── Account templates (inline HTML, same as controllers) ──────
      case "lab-welcome":
      case "user-signup":
      case "password-changed":
      case "password-reset":
      case "feedback":
        result = mockAccountEmail(templateId);
        break;

      // ─── Reminder templates (use real backend builders) ────────────
      case "family-reminder": {
        const schedule = mockScheduleForFamily({ studyType: "In-person" });
        const emailContent = buildFamilyReminderBody(schedule);
        result = {
          to: emailContent.to,
          from: emailContent.from,
          subject: emailContent.subject,
          htmlBody: emailContent.body,
          description:
            "Rendered by reminderTemplates.buildFamilyReminderBody() — sent to parents the day before a study.",
        };
        break;
      }

      case "manual-reminder": {
        const schedule = mockScheduleForFamily({ hasEmail: false });
        const emailContent = buildManualReminderBody(schedule);
        result = {
          to: emailContent.to,
          subject: emailContent.subject,
          htmlBody: emailContent.body,
          description:
            "Rendered by reminderTemplates.buildManualReminderBody() — sent to lab when family has no email.",
        };
        break;
      }

      case "completion-reminder": {
        const scheduleList = mockScheduleList();
        const htmlBody = buildCompletionReminderBody(
          MOCK.experimenterName,
          scheduleList
        );
        result = {
          to: `${MOCK.experimenterName} <${MOCK.experimenterEmail}>`,
          from: `${MOCK.labName} <${MOCK.labEmail}>`,
          subject: "Study confirmation reminder",
          htmlBody,
          description:
            "Rendered by reminderTemplates.buildCompletionReminderBody() — asks experimenters to confirm completions.",
        };
        break;
      }

      case "rejection-reminder": {
        const scheduleList = mockScheduleList();
        const htmlBody = buildRejectionReminderBody(
          MOCK.experimenterName,
          scheduleList
        );
        result = {
          to: `${MOCK.experimenterName} <${MOCK.experimenterEmail}>`,
          from: `${MOCK.labName} <${MOCK.labEmail}>`,
          subject: "Study follow-up reminder",
          htmlBody,
          description:
            "Rendered by reminderTemplates.buildRejectionReminderBody() — warns about unresolved appointments.",
        };
        break;
      }

      case "experimenter-reminder": {
        const experimenter = mockExperimenter();
        const htmlBody = buildExperimenterReminderBody(experimenter);
        result = {
          to: `${MOCK.experimenterName} <${MOCK.experimenterEmail}>`,
          from: `${MOCK.labName} <${MOCK.labEmail}>`,
          subject: "Reminder for upcoming studies",
          htmlBody,
          description:
            "Rendered by reminderTemplates.buildExperimenterReminderBody() — tomorrow's study schedule.",
        };
        break;
      }

      default:
        return res
          .status(404)
          .json({ error: `Unknown template: ${templateId}` });
    }

    const { renderEmail } = require("../utils/emailLayout");
    const isLabEmail = templateId.endsWith("-reminder");
    result.htmlBody = renderEmail({
      ...result,
      lab: isLabEmail ? { LabName: MOCK.labName, Email: MOCK.labEmail } : undefined,
      wide: ["completion-reminder", "rejection-reminder", "experimenter-reminder"].includes(templateId),
      category: isLabEmail ? "Research reminder" : "DRDB notification",
    });
    res.json(result);
  })
);

/**
 * @swagger
 * /api/emailTest/send:
 *   post:
 *     summary: Send a test email via the admin Gmail account
 *     tags: [Email Test]
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
 *               - subject
 *               - htmlBody
 *             properties:
 *               to:
 *                 type: string
 *               cc:
 *                 type: string
 *               bcc:
 *                 type: string
 *               subject:
 *                 type: string
 *               htmlBody:
 *                 type: string
 *     responses:
 *       200:
 *         description: Test email sent
 *       400:
 *         description: Missing required fields
 */
router.post(
  "/send",
  checkAuth,
  asyncHandler(async (req, res) => {
    const { to, cc, bcc, subject, htmlBody } = req.body;

    if (!to || !subject || !htmlBody) {
      return res.status(400).json({
        error: "Missing required fields: to, subject, htmlBody",
      });
    }

    const result = await sendAdminEmail({ to, cc, bcc, subject, htmlBody });

    res.status(200).json({
      message: "Test email sent successfully!",
      messageId: result.data?.id,
    });
  })
);

module.exports = router;
