const model = require("../models/DRDB");

const ALLOWED_EMAIL_TYPES = new Set(["Introduction", "Follow-up", "ThankYou"]);
const STOP_WORDS = new Set([
  "about", "after", "and", "are", "been", "being", "for", "from",
  "have", "into", "that", "the", "their", "there", "this", "with",
  "your", "will", "you", "study", "research",
]);

class AiEmailError extends Error {
  constructor(message, statusCode = 503, code = "AI_UNAVAILABLE") {
    super(message);
    this.name = "AiEmailError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function limitText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function meaningfulWords(value) {
  return new Set(
    stripHtml(value)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .map((word) => word.replace(/^-+|-+$/g, ""))
      .filter((word) => word.length >= 4 && !STOP_WORDS.has(word))
  );
}

function isCompletedSchedule(schedule) {
  return schedule && schedule.Status === "Confirmed" &&
    (schedule.Completed === 1 || schedule.Completed === true || schedule.Completed === "1");
}

function scheduleDate(schedule) {
  const value = schedule && (schedule.AppointmentTime || schedule.updatedAt || schedule.createdAt);
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function daysSince(date, now = new Date()) {
  if (!date) return null;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86400000));
}

function findSimilarStudy(currentStudy, historicalAppointments, now = new Date()) {
  if (!currentStudy) return null;
  const currentWords = meaningfulWords((currentStudy.StudyName || "") + " " + (currentStudy.Description || ""));
  if (currentWords.size < 2) return null;

  let bestMatch = null;
  for (const appointment of historicalAppointments) {
    const schedule = appointment.Schedule;
    const date = scheduleDate(schedule);
    if (!isCompletedSchedule(schedule) || !date || daysSince(date, now) > 180) continue;
    if (currentStudy.StudyType && appointment.Study && appointment.Study.StudyType !== currentStudy.StudyType) continue;

    const historicalWords = meaningfulWords(
      ((appointment.Study && appointment.Study.StudyName) || "") + " " +
      ((appointment.Study && appointment.Study.Description) || "")
    );
    const sharedWords = [...currentWords].filter((word) => historicalWords.has(word));
    const unionSize = new Set([...currentWords, ...historicalWords]).size;
    const score = unionSize ? sharedWords.length / unionSize : 0;

    if (sharedWords.length >= 2 && score >= 0.18 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = {
        studyName: (appointment.Study && appointment.Study.StudyName) || "a similar study",
        daysAgo: daysSince(date, now),
        score,
        description: (appointment.Study && appointment.Study.Description) || "",
      };
    }
  }
  return bestMatch;
}

function buildParticipationProfile(schedules, conversations, currentAppointmentIds, now = new Date()) {
  const currentIds = new Set(currentAppointmentIds.map(Number));
  const historicalAppointments = [];
  const successfulScheduleIds = new Set();
  const noShowScheduleIds = new Set();
  const cancelledScheduleIds = new Set();

  for (const schedule of schedules) {
    const appointments = Array.isArray(schedule.Appointments) ? schedule.Appointments : [];
    const isCurrentSchedule = appointments.some((appointment) => currentIds.has(Number(appointment.id)));
    for (const appointment of appointments) {
      if (!isCurrentSchedule) {
        historicalAppointments.push({ ...appointment, Schedule: schedule });
      }
    }
    if (!isCurrentSchedule && isCompletedSchedule(schedule)) successfulScheduleIds.add(schedule.id);
    if (!isCurrentSchedule && schedule.Status === "No Show") noShowScheduleIds.add(schedule.id);
    if (!isCurrentSchedule && schedule.Status === "Cancelled") cancelledScheduleIds.add(schedule.id);
  }

  const recentCount = (ids) => [...ids].filter((id) => {
    const date = scheduleDate(schedules.find((item) => item.id === id));
    return date && daysSince(date, now) <= 365;
  }).length;
  const lastContact = [...(conversations || [])]
    .map((conversation) => new Date(conversation.Time || conversation.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b - a)[0] || null;
  const completedSessionCount = successfulScheduleIds.size;
  const recentNoShowCount = recentCount(noShowScheduleIds);

  return {
    completedSessionCount,
    recentNoShowCount,
    recentCancellationCount: recentCount(cancelledScheduleIds),
    contactAttemptCount: (conversations || []).length,
    daysSinceLastContact: daysSince(lastContact, now),
    tone: completedSessionCount >= 3 && recentNoShowCount === 0
      ? "engaged"
      : completedSessionCount > 0
        ? "returning"
        : "new",
    historicalAppointments,
  };
}

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

function cleanModelText(value, maxLength) {
  return limitText(stripHtml(value).replace(/[\r\n]+/g, " "), maxLength);
}

function parseModelJson(content) {
  const text = String(content || "").trim();
  try {
    const parsed = JSON.parse(text);
    return {
      personalizationText: cleanModelText(parsed.personalizationText, 600),
      subjectSuggestion: cleanModelText(parsed.subjectSuggestion, 160),
    };
  } catch (error) {
    throw new AiEmailError("The AI provider returned an invalid draft.", 502, "AI_INVALID_RESPONSE");
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  if (typeof fetch !== "function") {
    throw new AiEmailError("This Node.js runtime does not provide fetch; upgrade Node.js to use AI email drafts.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new AiEmailError("The AI provider timed out. Your original email draft is still available.", 504, "AI_TIMEOUT");
    }
    throw new AiEmailError("The AI provider could not be reached.", 503, "AI_NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}

async function callProvider(prompt) {
  const provider = (process.env.AI_EMAIL_PROVIDER || "groq").toLowerCase();
  const timeoutMs = Math.max(1000, Number(process.env.AI_EMAIL_TIMEOUT_MS || 15000));

  if (provider === "ollama") {
    const response = await fetchWithTimeout(
      process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: process.env.OLLAMA_MODEL || "gemma3",
          stream: false,
          format: "json",
          messages: [
            { role: "system", content: "You return strict JSON and follow safety instructions." },
            { role: "user", content: prompt },
          ],
          options: { temperature: 0.4 },
        }),
      },
      timeoutMs
    );
    if (!response.ok) throw new AiEmailError("Ollama returned HTTP " + response.status + ".", 502, "AI_PROVIDER_ERROR");
    const data = await response.json();
    return parseModelJson(data.message && data.message.content);
  }

  if (provider !== "groq") {
    throw new AiEmailError("Unsupported AI_EMAIL_PROVIDER: " + provider + ".", 500, "AI_CONFIGURATION_ERROR");
  }
  if (!process.env.GROQ_API_KEY) {
    throw new AiEmailError("AI email drafts are not configured. Set GROQ_API_KEY on the server.", 503, "AI_NOT_CONFIGURED");
  }

  const response = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.GROQ_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        temperature: 0.4,
        max_tokens: 250,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You return strict JSON and follow safety instructions." },
          { role: "user", content: prompt },
        ],
      }),
    },
    timeoutMs
  );
  if (response.status === 429) throw new AiEmailError("The AI provider quota was reached. Try again later.", 429, "AI_RATE_LIMITED");
  if (!response.ok) throw new AiEmailError("Groq returned HTTP " + response.status + ".", 502, "AI_PROVIDER_ERROR");
  const data = await response.json();
  return parseModelJson(data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content);
}

async function loadContext({ familyId, appointmentIds, labId, emailType }) {
  const family = await model.family.findByPk(familyId, {
    attributes: ["id", "AssignedLab", "TrainingSet"],
  });
  if (!family) throw new AiEmailError("Family not found.", 404, "FAMILY_NOT_FOUND");
  if (process.env.AI_EMAIL_ALLOW_REAL_DATA !== "true" && !family.TrainingSet) {
    throw new AiEmailError("AI testing is limited to training-set or de-identified families until real-data processing is approved.", 403, "AI_TRAINING_DATA_ONLY");
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
    throw new AiEmailError("One or more appointments do not belong to this family.", 403, "AI_SCOPE_ERROR");
  }

  const labIds = new Set(currentAppointments.map((appointment) => Number(appointment.Study && appointment.Study.FK_Lab)).filter(Boolean));
  if (family.AssignedLab && labIds.size > 0 && !labIds.has(Number(family.AssignedLab))) {
    throw new AiEmailError("This family is outside the current lab scope.", 403, "AI_SCOPE_ERROR");
  }
  if (labId && labIds.size > 0 && !labIds.has(Number(labId))) {
    throw new AiEmailError("This appointment is outside the current lab scope.", 403, "AI_SCOPE_ERROR");
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
    throw new AiEmailError("AI email drafts are disabled. Set AI_EMAIL_ENABLED=true on the server.", 503, "AI_DISABLED");
  }
  if (!ALLOWED_EMAIL_TYPES.has(emailType)) {
    throw new AiEmailError("AI personalization is available for Introduction, Follow-up, and ThankYou emails.", 400, "AI_EMAIL_TYPE_NOT_SUPPORTED");
  }

  const loaded = await loadContext({ familyId, appointmentIds, labId, emailType });
  const draft = await callProvider(buildPrompt(loaded.context));
  const provider = (process.env.AI_EMAIL_PROVIDER || "groq").toLowerCase();
  return {
    ...draft,
    tone: loaded.context.tone,
    evidence: {
      recentSimilarStudy: Boolean(loaded.similarStudy),
      repeatParticipant: loaded.context.completedSessionCount > 0,
    },
    provider,
    model: process.env[provider === "ollama" ? "OLLAMA_MODEL" : "GROQ_MODEL"] ||
      (provider === "ollama" ? "gemma3" : "openai/gpt-oss-20b"),
  };
}

module.exports = {
  ALLOWED_EMAIL_TYPES,
  AiEmailError,
  buildParticipationProfile,
  findSimilarStudy,
  meaningfulWords,
  generateEmailPersonalization,
};
