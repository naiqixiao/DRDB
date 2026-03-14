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
 * Build mock for account-level emails (signup, password change, password reset).
 */
function mockAccountEmail(type) {
  const firstName = MOCK.experimenterName.split(" ")[0];
  const to = `${MOCK.experimenterName} <${MOCK.experimenterEmail}>`;

  const manualLink =
    "<a href='https://docs.google.com/document/d/1oaucm_FrpTxsO7UcOb-r-Y2Ck2zBe1G-BMvw_MD18N0/edit?usp=sharing'>A brief manual</a>";
  const googleLink =
    "<a href='https://mcmasteru365-my.sharepoint.com/:p:/g/personal/xiaon8_mcmaster_ca/ERk1uev-LENDrca6aWXwSqYBAn1J1OEsJ3tNjPkbpvcwtA?e=Gz73ZK'>How to set up a Google account to activate email and calendar functions.</a>";

  switch (type) {
    case "lab-welcome":
      return {
        to,
        subject: "Your user account has been created!",
        htmlBody:
          "<p>Hello " + firstName + ",</p> " +
          "<p>Welcome to the developmental research management system!</p>" +
          "<p>Your role is <b>" + MOCK.role + "</b>, and your temporary password is <b><em>" + MOCK.password + "</em></b>. " +
          "Please login with your email and temporary password at <a href=\"" + MOCK.appUrl + "\">" + MOCK.appUrl + "</a> to set your password." +
          "<br><b>If you're the lab manager, please update your lab email template in the Settings page.</p> " +
          "<p>" + manualLink + "</p>" +
          "<p>" + googleLink + "</p>" +
          "<p>Thank you!<br>Developmental Research Management System</p>",
        description:
          "Rendered by labService.createLab() — sent when a new lab is created.",
      };

    case "user-signup":
      return {
        to,
        subject: "Your user account has been created!",
        htmlBody:
          "<p>Hello " + firstName + ",</p> " +
          "<p>Welcome to the developmental research management system!<br>" +
          "Your role is <b>" + MOCK.role + "</b>, and your temporary password is <b><em>" + MOCK.password + "</em></b>. " +
          "Please login with your email and temporary password at <a href=\"" + MOCK.appUrl + "\">" + MOCK.appUrl + "</a> to set your password." +
          "<br><b>If you're the lab manager, please update your lab email template in the Settings page.</p> " +
          "<p>" + manualLink + "<br>" + googleLink + "</p>" +
          "<p> </p>" +
          "<p>Thank you! <br>Developmental Research Management System</p>",
        description:
          "Rendered by user.js signup — sent when a new user account is created.",
      };

    case "password-changed":
      return {
        to,
        subject: "Your login password is updated.",
        htmlBody:
          "<p>Hello " + firstName + ",</p> " +
          "<p>Your login password has recently been changed. <br>" +
          "If you didn't change your password, please contact your lab manager as soon as possible.</p> " +
          "<p> </p>" +
          "<p>Thank you!<br>Developmental Research Management System</p>",
        description:
          "Rendered by user.js changePassword — sent after a password change.",
      };

    case "password-reset":
      return {
        to,
        subject: "Your password is reset",
        htmlBody:
          "<p>Hello " + firstName + ",</p> " +
          "<p>You login password is reset, and the temporary passwor is: <b>" + MOCK.password + "</b></p> " +
          "<p>Please login to change your password.<br> " +
          "<p>" + manualLink + "<br>" + googleLink + "</p>" +
          "<p> </p>" +
          "<p>Thank you! <br>Developmental Research Management System</p>",
        description:
          "Rendered by user.js resetPassword — sent when an admin resets a password.",
      };

    case "feedback":
      return {
        to: "babylab@mcmaster.ca",
        cc: MOCK.experimenterEmail,
        subject: "[DRDB feedback] Calendar button not working on Firefox",
        htmlBody:
          "<p> from " + MOCK.experimenterEmail + "<p>" +
          "<p> on Schedule Page<p>" +
          "<p>====================<p>" +
          "<p>When I click the 'Add to Calendar' button on the Schedule page using Firefox 120, nothing happens.</p>",
        description:
          "Rendered by feedback.js — sent when a user submits feedback.",
      };

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
 * GET /api/emailTest/templates
 * Returns the list of available template IDs, labels, and icons.
 */
router.get(
  "/templates",
  checkAuth,
  asyncHandler(async (req, res) => {
    res.json(TEMPLATE_CATALOG);
  })
);

/**
 * GET /api/emailTest/render/:templateId
 * Renders a template using the ACTUAL backend builders with mock data.
 * Returns { to, cc?, from?, subject, htmlBody, description }.
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
 * POST /api/emailTest/send
 * Send a test email via the admin Gmail account.
 * Body: { to, cc?, bcc?, subject, htmlBody }
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
