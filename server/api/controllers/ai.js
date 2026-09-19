const expressAsyncHandler = require("express-async-handler");
const {
  AiEmailError,
  ALLOWED_EMAIL_TYPES,
  generateEmailPersonalization,
  polishEmailDraft,
} = require("../services/aiEmailService");
const {
  AiFamilySummaryError,
  generateFamilySummary,
} = require("../services/aiFamilySummaryService");

exports.emailPersonalization = expressAsyncHandler(async (req, res) => {
  const { familyId, appointmentIds, emailType } = req.body || {};
  const parsedFamilyId = Number(familyId);
  const parsedAppointmentIds = Array.isArray(appointmentIds)
    ? appointmentIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];

  if (!Number.isInteger(parsedFamilyId) || parsedFamilyId <= 0) {
    return res.status(400).json({ error: "familyId must be a positive integer." });
  }
  if (parsedAppointmentIds.length === 0 || parsedAppointmentIds.length > 10) {
    return res.status(400).json({ error: "appointmentIds must contain between 1 and 10 appointment IDs." });
  }
  if (!ALLOWED_EMAIL_TYPES.has(emailType)) {
    return res.status(400).json({ error: "Unsupported email type for AI personalization." });
  }

  try {
    const result = await generateEmailPersonalization({
      familyId: parsedFamilyId,
      appointmentIds: [...new Set(parsedAppointmentIds)],
      emailType,
      labId: req.userData?.lab,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AiEmailError) {
      return res.status(error.statusCode).json({ code: error.code, error: error.message });
    }
    console.error("AI email personalization error:", error);
    return res.status(500).json({ code: "AI_INTERNAL_ERROR", error: "AI personalization failed." });
  }
});

exports.polishEmail = expressAsyncHandler(async (req, res) => {
  const { familyId, appointmentIds, emailType, subject, body } = req.body || {};
  const parsedFamilyId = Number(familyId);
  const parsedAppointmentIds = Array.isArray(appointmentIds)
    ? appointmentIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];

  if (!Number.isInteger(parsedFamilyId) || parsedFamilyId <= 0) {
    return res.status(400).json({ error: "familyId must be a positive integer." });
  }
  if (parsedAppointmentIds.length === 0 || parsedAppointmentIds.length > 10) {
    return res.status(400).json({ error: "appointmentIds must contain between 1 and 10 appointment IDs." });
  }
  if (typeof emailType !== "string" || !emailType.trim()) {
    return res.status(400).json({ error: "emailType is required." });
  }
  if (typeof body !== "string" || !body.trim()) {
    return res.status(400).json({ error: "body must contain the current draft to polish." });
  }

  try {
    const result = await polishEmailDraft({
      familyId: parsedFamilyId,
      appointmentIds: [...new Set(parsedAppointmentIds)],
      emailType,
      subject: typeof subject === "string" ? subject : "",
      body,
      labId: req.userData?.lab,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AiEmailError) {
      return res.status(error.statusCode).json({ code: error.code, error: error.message });
    }
    console.error("AI email polish error:", error);
    return res.status(500).json({ code: "AI_INTERNAL_ERROR", error: "AI polishing failed." });
  }
});

exports.familySummary = expressAsyncHandler(async (req, res) => {
  const familyId = Number(req.body && req.body.familyId);
  if (!Number.isInteger(familyId) || familyId <= 0) {
    return res.status(400).json({ error: "familyId must be a positive integer." });
  }

  try {
    const result = await generateFamilySummary({
      familyId,
      labId: req.userData?.lab,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AiFamilySummaryError) {
      return res.status(error.statusCode).json({ code: error.code, error: error.message });
    }
    console.error("AI family summary error:", error);
    return res.status(500).json({ code: "AI_INTERNAL_ERROR", error: "AI family summary failed." });
  }
});
