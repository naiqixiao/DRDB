const asyncHandler = require("express-async-handler");
const model = require("../models/DRDB");
const { messageOptions } = require("../services/emailMessageService");
const { prepareEmail } = require("../services/emailBrandingService");
const { sendLabEmail, getLabOAuth2Client } = require("../utils/emailUtil");

exports.send = asyncHandler(async (req, res) => {
  const emailContent = req.body;

  try {
    const lab = await model.lab.findByPk(emailContent.lab);
    if (!lab) return res.status(404).json({ error: "Lab not found" });
    const options = await messageOptions(emailContent, lab);
    const result = await sendLabEmail(req.oAuth2Client, {
      to: emailContent.to,
      from: `${lab.LabName} <${lab.Email}>`,
      lab,
      cc: emailContent.cc,
      bcc: emailContent.bcc,
      subject: emailContent.subject,
      htmlBody: emailContent.body,
      labelNames: emailContent.labelNames,
      ...(options.details ? { layout: { details: options.details } } : {}),
    });

    res.status(200).send(result);
  } catch (error) {
    console.error("Gmail send error:", error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

// Same renderer and database identity as the send path; no Google access required.
exports.preview = asyncHandler(async (req, res) => {
  const lab = await model.lab.findByPk(req.body.lab);
  if (!lab) return res.status(404).json({ error: "Lab not found" });
  const options = await messageOptions(req.body, lab);
  const { htmlBody } = await prepareEmail(options, { preview: true });
  res.json({ htmlBody, appointmentIncluded: Boolean(options.details?.length) });
});

// Test sends use only the explicitly entered recipient, never participant routing.
exports.authorizeTest = asyncHandler(async (req, res, next) => {
  const requester = await model.personnel.findOne({ where: { id: req.userData.id } });
  if (!requester || requester.Retired || (requester.Role !== "Admin" && Number(requester.FK_Lab) !== Number(req.body.lab))) {
    return res.status(403).json({ message: "You can only send test emails for your own lab." });
  }
  next();
});

exports.sendTest = asyncHandler(async (req, res) => {
  const lab = await model.lab.findByPk(req.body.lab);
  if (!lab) return res.status(404).json({ message: "Lab not found." });
  if (!lab.Email) return res.status(400).json({ message: "Connect the lab’s Google email account in Settings before sending a test." });
  const options = await messageOptions(req.body, lab);
  try {
    const oAuth2Client = getLabOAuth2Client(lab.id);
    await sendLabEmail(oAuth2Client, {
      to: req.body.to,
      from: `${lab.LabName} <${lab.Email}>`,
      lab,
      subject: "[TEST] " + req.body.subject,
      htmlBody: req.body.body,
      layout: { title: req.body.subject, ...(options.details ? { details: options.details } : {}) },
    });
    res.json({ message: "Test email sent." });
  } catch (error) {
    console.error("Test email send failed:", error.message);
    const message = error.code === "ENOENT"
      ? "Connect the lab’s Google email account in Settings before sending a test."
      : "Unable to send the test email. Check the lab’s Google email connection in Settings and try again.";
    // Google connection failures must not invalidate the user's DRDB login.
    res.status(502).json({ message });
  }
});

exports.reminderTestOptions = asyncHandler(async (req, res) => {
  const { REMINDER_SAMPLES } = require('../services/reminderPreviewService');
  const studies = await model.study.findAll({ where: { FK_Lab: req.body.lab }, attributes: ['id', 'StudyName'], order: [['StudyName', 'ASC']] });
  res.json({ types: REMINDER_SAMPLES, studies });
});

async function reminderSample(req) {
  const lab = await model.lab.findByPk(req.body.lab);
  if (!lab) { const error = new Error('Lab not found.'); error.status = 404; throw error; }
  let study;
  if (req.body.studyId) {
    study = await model.study.findOne({ where: { id: req.body.studyId, FK_Lab: lab.id }, attributes: ['StudyName', 'ReminderTemplate'], raw: true });
    if (!study) { const error = new Error('Study not found for this lab.'); error.status = 404; throw error; }
  }
  const { getEffectiveTimezone } = require('../services/timezoneService');
  const { buildReminderSample } = require('../services/reminderPreviewService');
  return buildReminderSample({ type: req.body.type, lab, study, timeZone: await getEffectiveTimezone(lab.id) });
}

exports.previewReminderTest = asyncHandler(async (req, res) => {
  const sample = await reminderSample(req);
  const { htmlBody } = await prepareEmail({ ...sample, ...sample.layout }, { preview: true });
  res.json({ htmlBody, subject: sample.subject });
});

exports.sendReminderTest = asyncHandler(async (req, res) => {
  const sample = await reminderSample(req);
  if (!sample.lab.Email) return res.status(400).json({ message: 'Connect the lab’s Google email account in Settings before sending a test.' });
  try {
    await sendLabEmail(getLabOAuth2Client(sample.lab.id), {
      ...sample, layout: { ...sample.layout, title: sample.subject },
      from: `${sample.lab.LabName} <${sample.lab.Email}>`,
      to: req.body.to, subject: '[TEST] ' + sample.subject,
    });
    res.json({ message: 'Test reminder sent.' });
  } catch (error) {
    console.error('Test reminder send failed:', error.message);
    res.status(502).json({ message: 'Unable to send the test reminder. Check the lab’s Google email connection in Settings.' });
  }
});
