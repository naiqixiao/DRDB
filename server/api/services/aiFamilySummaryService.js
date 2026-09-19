const model = require("../models/DRDB");
const { AiServiceError, callProvider, currentProviderInfo } = require("./aiProvider");
const {
  isCompletedSchedule,
  scheduleDate,
  daysSince,
  buildParticipationProfile,
} = require("./participationProfile");

const INTENTION_VALUES = ["Likely", "Uncertain", "Unlikely"];

const FIELD_SPECS = [
  { key: "participationSummary", maxLength: 700 },
  { key: "intentionAssessment", maxLength: 20, allowedValues: INTENTION_VALUES, fallback: "Uncertain" },
  { key: "intentionRationale", maxLength: 400 },
];

function summarizeStudyTypes(historicalAppointments) {
  const types = new Set();
  for (const appointment of historicalAppointments) {
    if (isCompletedSchedule(appointment.Schedule) && appointment.Study && appointment.Study.StudyType) {
      types.add(appointment.Study.StudyType);
    }
  }
  return [...types];
}

function mostRecentCompletedStudy(historicalAppointments, now) {
  let best = null;
  for (const appointment of historicalAppointments) {
    if (!isCompletedSchedule(appointment.Schedule)) continue;
    const date = scheduleDate(appointment.Schedule);
    if (!date) continue;
    if (!best || date > best.date) {
      best = { date, studyName: (appointment.Study && appointment.Study.StudyName) || "a study" };
    }
  }
  return best ? { studyName: best.studyName, daysAgo: daysSince(best.date, now) } : null;
}

function distinctChildCount(historicalAppointments) {
  return new Set(historicalAppointments.map((appointment) => appointment.Child && appointment.Child.id).filter(Boolean)).size;
}

function distinctStudyCount(historicalAppointments) {
  return new Set(
    historicalAppointments
      .filter((appointment) => isCompletedSchedule(appointment.Schedule))
      .map((appointment) => appointment.Study && appointment.Study.id)
      .filter(Boolean)
  ).size;
}

function buildPrompt(context) {
  return [
    "Summarize a research-lab family's participation history and give an advisory intention-to-participate assessment.",
    "Return JSON only with this exact shape: {\"participationSummary\":\"\",\"intentionAssessment\":\"\",\"intentionRationale\":\"\"}.",
    "intentionAssessment must be exactly one of: Likely, Uncertain, Unlikely.",
    "Use only the supplied facts. Do not invent details, and do not make medical, developmental, or personal-character judgments about the child or family.",
    "This assessment is advisory only and will be reviewed by lab staff before any decision is made; do not present it as certain.",
    "When data is sparse (few sessions, no recent contact), prefer Uncertain over a confident guess.",
    "participationSummary should be 2-4 neutral, factual sentences a staff member could read before contacting the family.",
    "Do not include HTML, names, email addresses, phone numbers, or exact calendar dates.",
    "Children associated with this family: " + context.childCount,
    "Distinct studies completed: " + context.distinctStudyCount,
    "Study types previously completed: " + (context.studyTypes.length ? context.studyTypes.join(", ") : "none"),
    "Completed sessions: " + context.completedSessionCount,
    "Recent no-shows (last 12 months): " + context.recentNoShowCount,
    "Recent cancellations (last 12 months): " + context.recentCancellationCount,
    "Contact attempts recorded: " + context.contactAttemptCount,
    "Days since last contact: " + (context.daysSinceLastContact == null ? "unknown" : context.daysSinceLastContact),
    "Most recently completed study: " + (context.mostRecentStudy ? context.mostRecentStudy.studyName + " (" + context.mostRecentStudy.daysAgo + " days ago)" : "none on record"),
    "Participation tone classification: " + context.tone,
  ].join("\n");
}

async function loadFamilySummaryContext({ familyId, labId }, now = new Date()) {
  const family = await model.family.findByPk(familyId, {
    attributes: ["id", "AssignedLab", "TrainingSet"],
  });
  if (!family) throw new AiServiceError("Family not found.", 404, "FAMILY_NOT_FOUND");
  if (process.env.AI_FAMILY_SUMMARY_ALLOW_REAL_DATA !== "true" && !family.TrainingSet) {
    throw new AiServiceError("AI testing is limited to training-set or de-identified families until real-data processing is approved.", 403, "AI_TRAINING_DATA_ONLY");
  }
  if (labId && family.AssignedLab && Number(family.AssignedLab) !== Number(labId)) {
    throw new AiServiceError("This family is outside the current lab scope.", 403, "AI_SCOPE_ERROR");
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

  const profile = buildParticipationProfile(schedules, conversations, [], now);
  return {
    context: {
      tone: profile.tone,
      completedSessionCount: profile.completedSessionCount,
      recentNoShowCount: profile.recentNoShowCount,
      recentCancellationCount: profile.recentCancellationCount,
      contactAttemptCount: profile.contactAttemptCount,
      daysSinceLastContact: profile.daysSinceLastContact,
      childCount: distinctChildCount(profile.historicalAppointments),
      distinctStudyCount: distinctStudyCount(profile.historicalAppointments),
      studyTypes: summarizeStudyTypes(profile.historicalAppointments),
      mostRecentStudy: mostRecentCompletedStudy(profile.historicalAppointments, now),
    },
    hasAnyHistory: schedules.length > 0 || conversations.length > 0,
  };
}

function emptyHistoryResult(context) {
  return {
    participationSummary: "No participation history is on record for this family yet.",
    intentionAssessment: "Uncertain",
    intentionRationale: "No prior sessions or contact history are available to base an assessment on.",
    tone: context.tone,
    stats: {
      completedSessionCount: context.completedSessionCount,
      recentNoShowCount: context.recentNoShowCount,
      recentCancellationCount: context.recentCancellationCount,
      contactAttemptCount: context.contactAttemptCount,
      daysSinceLastContact: context.daysSinceLastContact,
      childCount: context.childCount,
      distinctStudyCount: context.distinctStudyCount,
      studyTypes: context.studyTypes,
    },
    provider: "none",
    model: "none",
  };
}

async function generateFamilySummary({ familyId, labId }) {
  if (process.env.AI_FAMILY_SUMMARY_ENABLED !== "true") {
    throw new AiServiceError("AI family participation summaries are disabled. Set AI_FAMILY_SUMMARY_ENABLED=true on the server.", 503, "AI_DISABLED");
  }

  const loaded = await loadFamilySummaryContext({ familyId, labId });
  if (!loaded.hasAnyHistory) {
    return emptyHistoryResult(loaded.context);
  }

  const provider = process.env.AI_FAMILY_SUMMARY_PROVIDER || process.env.AI_PROVIDER || "ninfer";
  const draft = await callProvider(buildPrompt(loaded.context), FIELD_SPECS, provider);
  const providerInfo = currentProviderInfo(provider);
  return {
    ...draft,
    tone: loaded.context.tone,
    stats: {
      completedSessionCount: loaded.context.completedSessionCount,
      recentNoShowCount: loaded.context.recentNoShowCount,
      recentCancellationCount: loaded.context.recentCancellationCount,
      contactAttemptCount: loaded.context.contactAttemptCount,
      daysSinceLastContact: loaded.context.daysSinceLastContact,
      childCount: loaded.context.childCount,
      distinctStudyCount: loaded.context.distinctStudyCount,
      studyTypes: loaded.context.studyTypes,
    },
    provider: providerInfo.provider,
    model: providerInfo.model,
  };
}

module.exports = {
  INTENTION_VALUES,
  AiFamilySummaryError: AiServiceError,
  summarizeStudyTypes,
  mostRecentCompletedStudy,
  distinctChildCount,
  distinctStudyCount,
  generateFamilySummary,
};
