const moment = require("moment-timezone");

const DEFAULT_TIMEZONE =
  process.env.TIMEZONE || process.env.TZ || "America/Toronto";

function normalizeAppointmentTime(value, timeZone = DEFAULT_TIMEZONE) {
  if (value instanceof Date || typeof value === "number") {
    return moment(value).toDate();
  }

  const text = String(value);
  const hasExplicitOffset = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(text);
  const parsed = hasExplicitOffset
    ? moment.parseZone(text)
    : moment.tz(text, timeZone);

  if (!parsed.isValid()) {
    throw new Error("Invalid appointment time.");
  }

  return parsed.toDate();
}

function formatDateInTimezone(value, pattern, timeZone) {
  const date = moment(value);
  return (timeZone ? date.tz(timeZone) : date).format(pattern);
}

module.exports = {
  formatDateInTimezone,
  normalizeAppointmentTime,
};
