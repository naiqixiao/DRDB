const model = require("../models/DRDB");
const { AiServiceError, stripHtml, limitText, callProvider, currentProviderInfo } = require("./aiProvider");
const {
  meaningfulWords,
  findSimilarStudy,
  buildParticipationProfile,
} = require("./participationProfile");

const ALLOWED_EMAIL_TYPES = new Set(["Introduction", "Follow-up", "ThankYou"]);

// Kept as a distinct name for backward compatibility with existing imports
// (server/api/controllers/ai.js, tests); it is the same error class used by
// every AI feature.
const AiEmailError = AiServiceError;

const FIELD_SPECS = [
  { key: "personalizationText", maxLength: 600 },
  { key: "subjectSuggestion", maxLength: 160 },
];

const POLISH_ALLOWED_TAGS = "p, br, strong, b, em, i, u, ul, ol, li, a";
const POLISH_FIELD_SPECS = [
  { key: "polishedSubject", maxLength: 200 },
  { key: "polishedBody", maxLength: 8000, preserveHtml: true },
];

function buildPrompt(context) {
  return [
    "Create a short personalization suggestion for a research-lab email.",
    "Return JSON only with this exact shape: {\"personalizationText\":\"\",\"subjectSuggestion\":\"\"}.",
    "Use only the supplied facts. Do not invent details, make medical/developmental inferences, mention internal notes, pressure the family, or imply that participation is expected.",
    "The paragraph should be warm, concise, and natural. If recentSimilarStudy is false, do not compare this study to a previous study.",
    "Do not include HTML, salutations, signatures, names, email addresses, phone numbers, or exact dates.",
    "A subject suggestion is optional; return an empty string when no improvement is needed.",
    "Email type: " + context.emailType,
    "Tone: " + context.tone,
    "Completed sessions: " + context.completedSessionCount,
    "Contact attempts recorded: " + context.contactAttemptCount,
    "Days since last contact: " + (context.daysSinceLastContact == null ? "unknown" : context.daysSinceLastContact),
    "recentSimilarStudy: " + (context.recentSimilarStudy ? "true" : "false"),
    "Current study description: " + (context.currentStudyDescription || "Not supplied"),
    "Similar-study description: " + (context.similarStudyDescription || "Not supplied"),
  ].join("\n");
}

function buildPolishPrompt({ emailType, subjectText, bodyHtml }) {
  return [
    "Polish the wording of this research-lab email while preserving its meaning and structure exactly.",
    "Return JSON only with this exact shape: {\"polishedSubject\":\"\",\"polishedBody\":\"\"}.",
    "polishedBody must be valid HTML using only these tags: " + POLISH_ALLOWED_TAGS + ".",
    "Keep every existing <a href=\"...\"> link with its original href attribute completely unchanged; only its visible link text may be lightly reworded.",
    "Do not add, remove, or change any fact, name, date, time, link URL, phone number, or template placeholder. Only improve grammar, clarity, and tone.",
    "Do not add a greeting or signature beyond what is already present, and do not add new sentences that introduce new information.",
    "If the subject does not need improvement, return it unchanged rather than inventing a new one.",
    "Email type: " + emailType,
    "Current subject: " + subjectText,
    "Current body (HTML):",
    bodyHtml,
  ].join("\n");
}

async function verifyFamilyAppointmentScope({ familyId, appointmentIds, labId }) {
  const family = await model.family.findByPk(familyId, {
    attributes: ["id", "AssignedLab", "TrainingSet"],
  });
  if (!family) throw new AiServiceError("Family not found.", 404, "FAMILY_NOT_FOUND");
  if (process.env.AI_EMAIL_ALLOW_REAL_DATA !== "true" && !family.TrainingSet) {
    throw new AiServiceError("AI testing is limited to training-set or de-identified families until real-data processing is approved.", 403, "AI_TRAINING_DATA_ONLY");
  }

  const schedules = await model.schedule.findAll({
    where: { FK_Family: familyId },
    include: [{
      model: model.appointment,
      include: [{ model: model.study, attributes: ["id", "FK_Lab"] }],
    }],
  });

  const requestedIds = appointmentIds.map(Number);
  const allAppointments = schedules.flatMap((schedule) => schedule.Appointments || []);
  const currentAppointments = allAppointments.filter((appointment) => requestedIds.includes(Number(appointment.id)));
  if (currentAppointments.length !== new Set(requestedIds).size) {
    throw new AiServiceError("One or more appointments do not belong to this family.", 403, "AI_SCOPE_ERROR");
  }

  const labIds = new Set(currentAppointments.map((appointment) => Number(appointment.Study && appointment.Study.FK_Lab)).filter(Boolean));
  if (family.AssignedLab && labIds.size > 0 && !labIds.has(Number(family.AssignedLab))) {
    throw new AiServiceError("This family is outside the current lab scope.", 403, "AI_SCOPE_ERROR");
  }
  if (labId && labIds.size > 0 && !labIds.has(Number(labId))) {
    throw new AiServiceError("This appointment is outside the current lab scope.", 403, "AI_SCOPE_ERROR");
  }

  return { family };
}

async function polishEmailDraft({ familyId, appointmentIds, emailType, labId, subject, body }) {
  if (process.env.AI_EMAIL_ENABLED !== "true") {
    throw new AiServiceError("AI email drafts are disabled. Set AI_EMAIL_ENABLED=true on the server.", 503, "AI_DISABLED");
  }
  if (!String(body || "").trim()) {
    throw new AiServiceError("There is no draft content to polish yet.", 400, "AI_EMPTY_DRAFT");
  }

  await verifyFamilyAppointmentScope({ familyId, appointmentIds, labId });

  const prompt = buildPolishPrompt({
    emailType,
    subjectText: limitText(String(subject || ""), 200),
    bodyHtml: limitText(String(body || ""), 6000),
  });
  const provider = process.env.AI_EMAIL_PROVIDER || process.env.AI_PROVIDER || "ninfer";
  const draft = await callProvider(prompt, POLISH_FIELD_SPECS, provider, { maxTokens: 1600 });
  const providerInfo = currentProviderInfo(provider);
  return {
    polishedSubject: draft.polishedSubject,
    polishedBody: draft.polishedBody,
    provider: providerInfo.provider,
    model: providerInfo.model,
  };
}

async function loadContext({ familyId, appointmentIds, labId, emailType }) {
  const family = await model.family.findByPk(familyId, {
    attributes: ["id", "AssignedLab", "TrainingSet"],
  });
  if (!family) throw new AiServiceError("Family not found.", 404, "FAMILY_NOT_FOUND");
  if (process.env.AI_EMAIL_ALLOW_REAL_DATA !== "true" && !family.TrainingSet) {
    throw new AiServiceError("AI testing is limited to training-set or de-identified families until real-data processing is approved.", 403, "AI_TRAINING_DATA_ONLY");
  }

  const schedules = await model.schedule.findAll({
    where: { FK_Family: familyId },
    include: [{
      model: model.appointment,
      include: [
        { model: model.study, attributes: ["id", "StudyName", "Description", "StudyType", "FK_Lab"] },
        { model: model.child, attributes: ["id", "Name"] },
      ],
    }],
    order: [["AppointmentTime", "DESC"]],
  });
  const conversations = await model.conversations.findAll({
    where: { FK_Family: familyId },
    attributes: ["Time", "createdAt"],
    order: [["Time", "DESC"]],
  });

  const requestedIds = appointmentIds.map(Number);
  const allAppointments = schedules.flatMap((schedule) =>
    (schedule.Appointments || []).map((appointment) => ({ ...appointment, Schedule: schedule }))
  );
  const currentAppointments = allAppointments.filter((appointment) => requestedIds.includes(Number(appointment.id)));
  if (currentAppointments.length !== new Set(requestedIds).size) {
    throw new AiServiceError("One or more appointments do not belong to this family.", 403, "AI_SCOPE_ERROR");
  }

  const labIds = new Set(currentAppointments.map((appointment) => Number(appointment.Study && appointment.Study.FK_Lab)).filter(Boolean));
  if (family.AssignedLab && labIds.size > 0 && !labIds.has(Number(family.AssignedLab))) {
    throw new AiServiceError("This family is outside the current lab scope.", 403, "AI_SCOPE_ERROR");
  }
  if (labId && labIds.size > 0 && !labIds.has(Number(labId))) {
    throw new AiServiceError("This appointment is outside the current lab scope.", 403, "AI_SCOPE_ERROR");
  }

  const profile = buildParticipationProfile(schedules, conversations, requestedIds);
  const currentStudy = currentAppointments[0] && currentAppointments[0].Study;
  const similarStudy = findSimilarStudy(currentStudy, profile.historicalAppointments);
  return {
    context: {
      emailType,
      tone: profile.tone,
      completedSessionCount: profile.completedSessionCount,
      contactAttemptCount: profile.contactAttemptCount,
      daysSinceLastContact: profile.daysSinceLastContact,
      recentSimilarStudy: Boolean(similarStudy),
      currentStudyDescription: limitText(stripHtml(currentStudy && currentStudy.Description), 1200),
      similarStudyDescription: limitText(stripHtml(similarStudy && similarStudy.description), 1200),
    },
    similarStudy,
  };
}

async function generateEmailPersonalization({ familyId, appointmentIds, emailType, labId }) {
  if (process.env.AI_EMAIL_ENABLED !== "true") {
    throw new AiServiceError("AI email drafts are disabled. Set AI_EMAIL_ENABLED=true on the server.", 503, "AI_DISABLED");
  }
  if (!ALLOWED_EMAIL_TYPES.has(emailType)) {
    throw new AiServiceError("AI personalization is available for Introduction, Follow-up, and ThankYou emails.", 400, "AI_EMAIL_TYPE_NOT_SUPPORTED");
  }

  const loaded = await loadContext({ familyId, appointmentIds, labId, emailType });
  const provider = process.env.AI_EMAIL_PROVIDER || process.env.AI_PROVIDER || "ninfer";
  const draft = await callProvider(buildPrompt(loaded.context), FIELD_SPECS, provider);
  const providerInfo = currentProviderInfo(provider);
  return {
    ...draft,
    tone: loaded.context.tone,
    evidence: {
      recentSimilarStudy: Boolean(loaded.similarStudy),
      repeatParticipant: loaded.context.completedSessionCount > 0,
    },
    provider: providerInfo.provider,
    model: providerInfo.model,
  };
}

module.exports = {
  ALLOWED_EMAIL_TYPES,
  AiEmailError,
  buildParticipationProfile,
  findSimilarStudy,
  meaningfulWords,
  generateEmailPersonalization,
  polishEmailDraft,
};
