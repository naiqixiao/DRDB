const expressAsyncHandler = require("express-async-handler");
const {
  AiEmailError,
  ALLOWED_EMAIL_TYPES,
  generateEmailPersonalization,
} = require("../services/aiEmailService");

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
