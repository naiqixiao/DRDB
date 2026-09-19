const { stripHtml } = require("./aiProvider");

const STOP_WORDS = new Set([
  "about", "after", "and", "are", "been", "being", "for", "from",
  "have", "into", "that", "the", "their", "there", "this", "with",
  "your", "will", "you", "study", "research",
]);

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

/**
 * Aggregates a family's scheduling history into signals shared by every AI
 * feature. currentAppointmentIds are excluded from the historical counts
 * (used by email personalization to avoid counting the appointment the email
 * is about); pass an empty array to include every appointment on record
 * (used by the family participation summary).
 */
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

module.exports = {
  meaningfulWords,
  isCompletedSchedule,
  scheduleDate,
  daysSince,
  findSimilarStudy,
  buildParticipationProfile,
};
