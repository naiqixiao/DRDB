const asyncHandler = require("express-async-handler");
const model = require("../models/DRDB");
const moment = require("moment");

// Require google from googleapis package.
const { google } = require("googleapis");

const config = require("../../config/general");

// Create a new calender instance.

// {
//     "summary": "Meeting with David and Joe",
//     "location": "McMaster University",
//     "start": {
//         "dateTime": "2020-03-19T12:00:00.000",
//         "timeZone": config.timeZone
//     },
//     "end": {
//         "dateTime": "2020-03-19T15:30:00.000",
//         "timeZone": config.timeZone
//     },
//     "status": "confirmed",
//     "attendees": [
//         {
//             "email": "g.jaeger0226@gmail.com"

//         },
//         {
//             "email": "danmei@nuralogix.ai"
//         }
//     ],
//     "sendUpdates": "all"
// }

exports.create = asyncHandler(async (req, res) => {
  var event = req.body;
  const calendar = google.calendar({ version: "v3", auth: req.oAuth2Client });

  event.start = {
    dateTime: moment(event.AppointmentTime).toISOString(true),
    timeZone: config.timeZone,
  }

  event.end = {
    dateTime: moment(event.AppointmentTime)
      .add(1, "h")
      .toISOString(true),
    timeZone: config.timeZone,
  }

  try {

    const calEvent = await calendar.events.insert({
      calendarId: event.calendarId,
      resource: event,
      sendNotifications: true,
    });

    var updatedScheduleInfo = {};
    updatedScheduleInfo.calendarEventId = calEvent.data.id;
    updatedScheduleInfo.eventURL = calEvent.data.htmlLink;

    await model.schedule.update(updatedScheduleInfo, {
      where: { id: event.scheduleId },
    });

    res.status(200).send(calEvent.data);
    console.log("Calendar event successfully created: " + calEvent.data.id);
  } catch (error) {
    throw error;
  }
});

exports.update = asyncHandler(async (req, res) => {
  const event = req.body;
  const calendar = google.calendar({ version: "v3", auth: req.oAuth2Client });

  try {

    const calEvent = await calendar.events.patch({
      calendarId: "primary",
      eventId: req.query.eventId,
      resource: event,
      sendNotifications: true,
    });
    res.status(200).send(calEvent.data);
    console.log("Calendar event successfully updated: " + calEvent.data.id);
  } catch (error) {
    throw error;
  }
});

exports.delete = asyncHandler(async (req, res) => {
  try {
    const calendar = google.calendar({ version: "v3", auth: req.oAuth2Client });

    const calEvent = await calendar.events.delete({
      calendarId: "primary",
      eventId: req.query.eventId,
      sendNotifications: true,
    });
    res.status(200).send(calEvent.data);
    console.log("Calendar event successfully deleted: " + calEvent.data.id);
  } catch (error) {
    throw error;
  }
});

exports.createSecondaryCalendar = asyncHandler(async (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: req.oAuth2Client });
  const calendarName = req.body.calendarName;

  try {
    // const { summary, timeZone } = req.body;
    
    const createdCalendar = await calendar.calendars.insert({
      requestBody: {
        summary: calendarName,
        timeZone: config.timeZone,
      },
    });
    
    res.status(200).json({ calendarId: createdCalendar.data.id, message: 'A new calendar is created.' });

  } catch (error) {
    console.error('Error creating secondary calendar:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});