/**
 * Reminder Controller
 *
 * Thin orchestration layer that wires together:
 * - reminderService.js (data queries)
 * - reminderTemplates.js (email HTML construction)
 * - emailUtil.js (email sending)
 */

const asyncHandler = require("express-async-handler");
const model = require("../models/DRDB");
const log = require("../controllers/log");
const { sendLabEmail, sendAdminEmail, getLabOAuth2Client } = require("../utils/emailUtil");
const {
  buildFamilyReminderBody,
  buildManualReminderBody,
  buildCompletionReminderBody,
  buildRejectionReminderBody,
  buildExperimenterReminderBody,
} = require("../utils/reminderTemplates");
const {
  getCompletionReminderData,
  getRejectionReminderData,
  getFamilyReminderSchedules,
  getExperimenterReminderData,
} = require("../services/reminderService");

function handleReminderError(logLabel, error, res) {
  console.error(logLabel, error);

  if (res && typeof res.status === "function" && !res.headersSent) {
    return res.status(500).json({ error: error.message });
  }

  throw error;
}

function resolveLabId(context) {
  if (context === null || context === undefined) return null;

  if (typeof context === "number" || typeof context === "string") {
    const parsed = Number(context);
    return Number.isInteger(parsed) ? parsed : null;
  }

  const parsed = Number(
    context.labId ?? context.query?.labId ?? context.body?.labId
  );

  return Number.isInteger(parsed) ? parsed : null;
}

// ─── Auto-completion reminder ──────────────────────────────────────
// Sends to experimenters asking them to confirm yesterday's study completions.
exports.autoCompletionReminder = asyncHandler(async (req, res) => {
  try {
    const labId = resolveLabId(req);
    const { autoCompletionList, schedules, primaryExperimenters } =
      await getCompletionReminderData(labId);

    for (const reminder of autoCompletionList) {
      const htmlBody = buildCompletionReminderBody(
        reminder.experimenterName,
        reminder.scheduleList
      );

      const oAuth2Client = getLabOAuth2Client(reminder.scheduleList[0].LabID);

      await sendLabEmail(oAuth2Client, {
        from: `${reminder.scheduleList[0].LabName}<${reminder.scheduleList[0].LabEmail}>`,
        to: `${reminder.experimenterName}<${reminder.experimenterEmail}>`,
        subject: "[DRDB] Study confirmation reminder",
        htmlBody,
        labelNames: ["Reminder-email"],
      });

      await log.createLog(
        "AutoCompletion reminder sent",
        { Name: "", Email: "", LabName: reminder.scheduleList[0].LabName },
        "Reminder email (study completion) is sent to " +
          reminder.experimenterName
      );
    }

    if (res) {
      res.status(200).send({
        info: "reminder email sent!",
        autoCompletionList,
        schedules,
        primaryExperimenters,
      });
    }
  } catch (error) {
    return handleReminderError("Reminder email error:", error, res);
  }
});

// ─── Auto-rejection/follow-up reminder ─────────────────────────────
// Sends to researchers about unresolved tentative/rescheduling/no-show appointments.
exports.autoRejectionReminder = asyncHandler(async (req, res) => {
  try {
    const labId = resolveLabId(req);
    const { autoRejectionList, schedules, contactResearchers } =
      await getRejectionReminderData(labId);

    for (const reminder of autoRejectionList) {
      const htmlBody = buildRejectionReminderBody(
        reminder.researcherName,
        reminder.scheduleList
      );

      const oAuth2Client = getLabOAuth2Client(reminder.scheduleList[0].LabID);

      await sendLabEmail(oAuth2Client, {
        from: `${reminder.scheduleList[0].LabName}<${reminder.scheduleList[0].LabEmail}>`,
        to: `${reminder.researcherName}<${reminder.researcherEmail}>`,
        subject: "[DRDB] Study follow-up reminder",
        htmlBody,
        labelNames: ["Reminder-email"],
      });

      await log.createLog(
        "AutoRejection reminder sent",
        { Name: "", Email: "", LabName: reminder.scheduleList[0].LabName },
        "Reminder email (study rejection) is sent to " +
          reminder.researcherName
      );
    }

    if (res) {
      res.status(200).send({
        info: "autoRejection reminder email sent!",
        autoRejectionList,
        schedules,
        contactResearchers,
      });
    }
  } catch (error) {
    return handleReminderError("Auto-rejection reminder error:", error, res);
  }
});

// ─── Family reminder ───────────────────────────────────────────────
// Sends to parents the day before a confirmed study appointment.
exports.reminderEmail = asyncHandler(async (req, res) => {
  try {
    const labId = resolveLabId(req);
    const schedules = await getFamilyReminderSchedules(labId);

    for (const schedule of schedules) {
      const labels = ["Reminder-email"];

      for (const appointment of schedule.Appointments) {
        labels.push(appointment.Study.dataValues.StudyName);
      }

      if (!!schedule.Appointments[0].Study.ReminderTemplate) {
        if (!!schedule.Family.Email) {
          // Family has email — send directly from the lab account
          const oAuth2Client = getLabOAuth2Client(
            schedule.Appointments[0].Study.Lab.id
          );

          const emailContent = buildFamilyReminderBody(schedule);

          await sendLabEmail(oAuth2Client, {
            to: emailContent.to,
            from: emailContent.from,
            subject: emailContent.subject,
            htmlBody: emailContent.body,
            labelNames: labels,
          });

          await model.schedule.update(
            { Reminded: 1 },
            { where: { id: schedule.id } }
          );

          await log.createLog(
            "Auto reminder sent",
            {
              Name: "",
              Email: "",
              LabName: schedule.Appointments[0].Study.Lab.LabName,
            },
            "Reminder email is sent to " + schedule.Family.Email
          );
        } else {
          // Family has no email — send a manual reminder to the lab
          var emailContent = buildManualReminderBody(schedule);

          await sendAdminEmail({
            to: emailContent.to,
            subject: emailContent.subject,
            htmlBody: emailContent.body,
          });

          await log.createLog(
            "Manual reminder",
            {
              Name: "",
              Email: "",
              LabName: schedule.Appointments[0].Study.Lab.LabName,
            },
            "An email about reminding participants for tomorrow's study is sent to " +
              schedule.Appointments[0].Study.Lab.Email
          );
        }
      }
    }

    if (res) {
      res.status(200).send({ info: "reminder email sent!", count: schedules.length });
    }
  } catch (error) {
    return handleReminderError("Family reminder error:", error, res);
  }
});

// ─── Experimenter reminder ─────────────────────────────────────────
// Sends to each experimenter with a summary of their studies tomorrow.
exports.reminderEmailforExperimenters = asyncHandler(async (req, res) => {
  try {
    const labId = resolveLabId(req);
    const experimenters = await getExperimenterReminderData(labId);

    for (const experimenter of experimenters) {
      const htmlBody = buildExperimenterReminderBody(experimenter);

      const oAuth2Client = getLabOAuth2Client(experimenter.Lab.id);

      await sendLabEmail(oAuth2Client, {
        from: `${experimenter.Lab.LabName}<${experimenter.Lab.Email}>`,
        to: `${experimenter.Name}<${experimenter.Email}>`,
        subject: "[DRDB] Reminder for upcoming studies",
        htmlBody,
        labelNames: ["Reminder-email"],
      });

      await log.createLog(
        "Auto experimenterReminder sent",
        { Name: "", Email: "", LabName: experimenter.Lab.LabName },
        "Reminder email (experimenter) is sent to " + experimenter.Name
      );
    }

    if (res) {
      res.status(200).send({
        info: "experimenter reminder email sent!",
        count: experimenters.length,
      });
    }
  } catch (error) {
    return handleReminderError("Experimenter reminder error:", error, res);
  }
});
