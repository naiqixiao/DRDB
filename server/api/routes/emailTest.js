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

const moment = require("moment");

// ─── Mock data fixtures ──────────────────────────────────────────────
// These simulate real Sequelize model shapes so the template builders
// can process them exactly as they would with real data.

const MOCK = {
  labName: "McMaster BabyLab",
  labEmail: "babylab@mcmaster.ca",
  labZoom: "https://zoom.us/j/1234567890",
  transportationInstructions:
    "<p>Our lab is located at Psychology Building, McMaster University. There are 3 parking lots in front of the building.</p>",
  emailClosing: "<p>Please feel free to let us know if you have questions.</p>",

  parentName: "Sarah Johnson",
  parentEmail: "sarah.johnson@gmail.com",
  parentPhone: "9055259140",
  childName: "Liam Johnson",
  childDob: "2024-06-15",

  experimenterName: "Alex Chen",
  experimenterEmail: "chena3@mcmaster.ca",
  experimenterZoom: "https://zoom.us/j/9876543210",

  e2Name: "Priya Patel",
  e2Email: "patelp7@mcmaster.ca",

  studyName: "Infant Visual Attention Study",
  studyName2: "Language Development Study",
  reminderTemplate:
    "<p>${{childName}} will be sitting on your lap and watch a short clip of videos on a screen in front of them. The study will last for about 10 minutes.</p>",

  password: "xK9mQ3vB7nR2",
  role: "Lab manager",
  appUrl: "https://drdb.example.com",
};

/**
 * Build a mock schedule object that matches the Sequelize model shape
 * expected by buildFamilyReminderBody / buildManualReminderBody.
 */
function mockScheduleForFamily(opts = {}) {
  const studyType = opts.studyType || "In-person";
  const hasEmail = opts.hasEmail !== false;

  return {
    AppointmentTime: moment().add(1, "days").hour(10).minute(30).toDate(),
    Family: {
      NamePrimary: hasEmail ? MOCK.parentName : null,
      Email: hasEmail ? MOCK.parentEmail : null,
      TrainingSet: false,
    },
    Personnel: {
      Name: MOCK.experimenterName,
      Role: "Research Assistant",
    },
    Appointments: [
      {
        Child: { Name: MOCK.childName, DoB: MOCK.childDob, Sex: "M" },
        Study: {
          StudyName: MOCK.studyName,
          StudyType: studyType,
          ReminderTemplate: MOCK.reminderTemplate,
          Lab: {
            id: 1,
            LabName: MOCK.labName,
            Email: MOCK.labEmail,
            ZoomLink: MOCK.labZoom,
            TransportationInstructions: MOCK.transportationInstructions,
            EmailClosing: MOCK.emailClosing,
          },
        },
        PrimaryExperimenter: [
          {
            Name: MOCK.experimenterName,
            Email: MOCK.experimenterEmail,
            ZoomLink: MOCK.experimenterZoom,
          },
        ],
        SecondaryExperimenter: [
          { Name: MOCK.e2Name, Email: MOCK.e2Email },
        ],
      },
    ],
  };
}

/**
 * Build mock scheduleList for completion/rejection reminder templates.
 */
function mockScheduleList() {
  return [
    {
      id: 101,
      Email: MOCK.parentEmail,
      Name: MOCK.parentName,
      StudyName: MOCK.studyName,
      AppointmentTime: moment().subtract(1, "days").hour(10).minute(30).toDate(),
      Status: "TBD",
      LabName: MOCK.labName,
      LabEmail: MOCK.labEmail,
      LabID: 1,
      updatedAt: moment().subtract(7, "days").hour(15).minute(15).toDate(),
    },
    {
      id: 102,
      Email: "mwong@gmail.com",
      Name: "Michael Wong",
      StudyName: MOCK.studyName2,
      AppointmentTime: moment().subtract(1, "days").hour(14).minute(0).toDate(),
      Status: "No Show",
      LabName: MOCK.labName,
      LabEmail: MOCK.labEmail,
      LabID: 1,
      updatedAt: moment().subtract(8, "days").hour(11).minute(0).toDate(),
    },
  ];
}

/**
 * Build a mock experimenter object for the experimenter reminder template.
 */
function mockExperimenter() {
  return {
    Name: MOCK.experimenterName,
    Email: MOCK.experimenterEmail,
    ZoomLink: MOCK.experimenterZoom,
    Lab: { id: 1, LabName: MOCK.labName, Email: MOCK.labEmail },
    PrimaryExperimenterof: [
      {
        Schedule: {
          AppointmentTime: moment().add(1, "days").hour(10).minute(30).toDate(),
        },
        Study: { StudyName: MOCK.studyName },
        Child: {
          Name: MOCK.childName,
          Family: {
            NamePrimary: MOCK.parentName,
            Phone: MOCK.parentPhone,
            Email: MOCK.parentEmail,
          },
        },
        SecondaryExperimenter: [
          { Name: MOCK.e2Name, Email: MOCK.e2Email },
        ],
      },
    ],
    SecondaryExperimenterof: [
      {
        Schedule: {
          AppointmentTime: moment().add(1, "days").hour(14).minute(0).toDate(),
        },
        Study: { StudyName: MOCK.studyName2 },
        Child: {
          Name: "Emma Wong",
          Family: {
            NamePrimary: "Michael Wong",
            Phone: "4165550199",
            Email: "mwong@gmail.com",
          },
        },
        PrimaryExperimenter: [
          { Name: MOCK.e2Name, Email: MOCK.e2Email, ZoomLink: null },
        ],
        SecondaryExperimenter: [
          { Name: MOCK.experimenterName, Email: MOCK.experimenterEmail },
        ],
      },
    ],
  };
}

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
        "<p>When I click the 'Add to Calendar' button on the Schedule page using Firefox 120, nothing happens.</p>"
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
          subject: "[DRDB] Study confirmation reminder",
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
          subject: "[DRDB] Study follow-up reminder",
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
          subject: "[DRDB] Reminder for upcoming studies",
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
