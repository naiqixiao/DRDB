/**
 * Google Calendar Service
 *
 * Wraps all Google Calendar API interactions behind clean functions.
 * Controllers should call these instead of using googleapis directly.
 */

const { google } = require("googleapis");
const moment = require("moment");
const config = require("../../config/general");

google.options({
  params: {
    sendUpdates: "all",
  },
});

/**
 * Create a calendar event.
 *
 * @param {Object} oAuth2Client - Authenticated OAuth2 client
 * @param {Object} event - Event object with AppointmentTime, calendarId, etc.
 * @returns {Object} The event with eventURL and eventId populated
 */
async function createEvent(oAuth2Client, event) {
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  event.start = {
    dateTime: moment(event.AppointmentTime).toISOString(true),
    timeZone: config.timeZone,
  };

  event.end = {
    dateTime: moment(event.AppointmentTime).add(1, "h").toISOString(true),
    timeZone: config.timeZone,
  };

  const calEvent = await calendar.events.insert({
    calendarId: event.calendarId,
    resource: event,
    sendUpdates: "all",
    sendNotifications: true,
  });

  event.eventURL = calEvent.data.htmlLink;
  event.eventId = calEvent.data.id;

  return event;
}

/**
 * Update (patch) a calendar event.
 *
 * @param {Object} oAuth2Client - Authenticated OAuth2 client
 * @param {Object} event - Event object with eventId, calendarId, AppointmentTime, etc.
 * @returns {Object} The event with updated eventURL and eventId
 */
async function updateEvent(oAuth2Client, event) {
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  event.start = {
    dateTime: moment(event.AppointmentTime).toISOString(true),
    timeZone: config.timeZone,
  };

  event.end = {
    dateTime: moment(event.AppointmentTime).add(1, "h").toISOString(true),
    timeZone: config.timeZone,
  };

  const calEvent = await calendar.events.patch({
    calendarId: event.calendarId,
    eventId: event.eventId,
    resource: event,
    sendUpdates: "all",
    sendNotifications: true,
  });

  event.eventURL = calEvent.data.htmlLink;
  event.eventId = calEvent.data.id;

  console.log("Calendar event successfully updated.");
  return event;
}

/**
 * Delete a calendar event.
 *
 * @param {Object} oAuth2Client - Authenticated OAuth2 client
 * @param {string} calendarId - Calendar ID (e.g. "primary")
 * @param {string} eventId - Event ID to delete
 */
async function deleteEvent(oAuth2Client, calendarId, eventId) {
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates: "all",
  });

  console.log("Calendar event successfully deleted.");
}

/**
 * Create a secondary calendar (for testing rooms, etc.).
 *
 * @param {Object} oAuth2Client - Authenticated OAuth2 client
 * @param {string} calendarName - Name for the new calendar
 * @returns {{ calendarId: string }} The created calendar's ID
 */
async function createSecondaryCalendar(oAuth2Client, calendarName) {
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  const createdCalendar = await calendar.calendars.insert({
    requestBody: {
      summary: calendarName,
      timeZone: config.timeZone,
      backgroundColor: generateDarkColorHex(),
    },
  });

  return { calendarId: createdCalendar.data.id };
}

/**
 * Build a calendar event description from notes and appointment data.
 *
 * @param {string} notes - Appointment notes
 * @param {Object} appointment - Appointment object with Study, E1, E2, PrimaryExperimenter
 * @returns {string} HTML-formatted description
 */
function buildCalendarDescription(notes, appointment) {
  var description = "<b>Note: </b>" + notes + "<br>";

  description =
    description +
    "=================" +
    "<br><b>" +
    appointment.Study.StudyName +
    "</b><br>" +
    "<b>E1: </b>" +
    appointment.E1 +
    "<br>" +
    "<b>E2: </b>" +
    appointment.E2 +
    "<br>";

  if (appointment.Study.StudyType == "Online")
    description =
      description +
      "<b>zoom link: </b>" +
      appointment.PrimaryExperimenter[0].ZoomLink;

  return description;
}

// ─── Private helpers ──────────────────────────────────────────────

function generateDarkColorHex() {
  function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  var r = randomInRange(0, 200).toString(16).padStart(2, "0");
  var g = randomInRange(0, 200).toString(16).padStart(2, "0");
  var b = randomInRange(0, 200).toString(16).padStart(2, "0");

  return "#" + r + g + b;
}

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
  createSecondaryCalendar,
  buildCalendarDescription,
};
