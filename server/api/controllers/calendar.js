const asyncHandler = require("express-async-handler");
const model = require("../models/DRDB");
const moment = require("moment");

// Require google from googleapis package.
const { google } = require("googleapis");

const config = require("../../config/general");

// a new calendar event creation function to generate a list of events for each appointment, and then send the output back to frontend.
exports.create = asyncHandler(async (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: req.oAuth2Client });

  var event = req.body.event;

  event.start = {
    dateTime: moment(event.AppointmentTime).toISOString(true),
    timeZone: config.timeZone,
  };

  event.end = {
    dateTime: moment(event.AppointmentTime)
      .add(1, "h")
      .toISOString(true),
    timeZone: config.timeZone,
  };

  try {
    const calEvent = await calendar.events.insert({
      calendarId: event.calendarId,
      resource: event,
      sendNotifications: true,
    });

    event.eventURL = calEvent.data.htmlLink;
    event.eventId = calEvent.data.id;

    res.status(200).send(event);
  } catch (error) {
    console.log("*****", error);
    throw error;
  }
});

// exports.create0 = asyncHandler(async (req, res) => {
//   var event = req.body;
//   // console.log(event);
//   const calendar = google.calendar({ version: "v3", auth: req.oAuth2Client });

//   event.start = {
//     dateTime: moment(event.AppointmentTime).toISOString(true),
//     timeZone: config.timeZone,
//   };

//   event.end = {
//     dateTime: moment(event.AppointmentTime)
//       .add(1, "h")
//       .toISOString(true),
//     timeZone: config.timeZone,
//   };

//   try {
//     for (const app of event.Appointments) {
//       const calEvent = await calendar.events.insert({
//         calendarId: app.calendarId,
//         resource: {
//           start: event.start,
//           end: event.end,
//           Note: "sample note text",
//           summary: event.summary,
//           location: event.location,
//           description: calendarDescription(event.Note, app),
//           attendees: app.attendees,
//         },
//         sendNotifications: true,
//       });

//       // update appointment info by inserting eventId and URL.
//       var updatedAppointmentInfo = {};
//       updatedAppointmentInfo.eventId = calEvent.data.id;
//       updatedAppointmentInfo.eventURL = calEvent.data.htmlLink;

//       await model.appointment.update(updatedAppointmentInfo, {
//         where: { id: app.id },
//       });

//       console.log("Calendar event successfully created: " + calEvent.data.id);
//     }

//     res.status(200).send("calendar event created");
//   } catch (error) {
//     console.log("*****", error);
//     throw error;
//   }
// });

exports.update = asyncHandler(async (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: req.oAuth2Client });

  const event = req.body.event;

  event.start = {
    dateTime: moment(event.AppointmentTime).toISOString(true),
    timeZone: config.timeZone,
  };

  event.end = {
    dateTime: moment(event.AppointmentTime)
      .add(1, "h")
      .toISOString(true),
    timeZone: config.timeZone,
  };

  try {
    const calEvent = await calendar.events.patch({
      calendarId: event.calendarId,
      eventId: event.eventId,
      resource: event,
      sendNotifications: true,
    });

    event.eventURL = calEvent.data.htmlLink;
    event.eventId = calEvent.data.id;

    console.log("Calendar event successfully updated.");
    res.status(200).send(event);
  } catch (error) {
    throw error;
  }
});

exports.delete = asyncHandler(async (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: req.oAuth2Client });

  try {
    const Schedule = await model.schedule.findOne({
      where: { id: req.query.FK_Schedule },
    });

    if (Schedule.eventId) {
      calendar.events.delete({
        calendarId: "primary",
        eventId: Schedule.eventId,
      });
      await model.schedule.update(
        { eventURL: null, eventId: null },
        { where: { id: req.query.FK_Schedule } }
      );
      return;
    }

    const Appointment = await model.appointment.findOne({
      where: { id: req.query.id },
    });

    const TestingRooms = await model.testingRoom.findAll({
      where: { FK_Lab: req.query.lab },
    });

    const Study = await model.study.findOne({
      where: { id: Appointment.FK_Study },
    });

    const testingRoomId = Study.FK_TestingRoom;
    let calId;
    if (testingRoomId) {
      const curTestingRoom = testingRooms.find(
        (room) => room.id === testingRoomId
      );
      calId = curTestingRoom.calendarId;
    } else {
      calId = "primary";
    }

    if (Appointment.eventId) {
      calendar.events.delete({
        calendarId: calId,
        eventId: Appointment.eventId,
      });
    }

    await model.appointment.update(
      { eventURL: null, eventId: null },
      { where: { id: req.query.id } }
    );

    console.log("Calendar event successfully deleted.");
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
        backgroundColor: generateDarkColorHex(),
      },
    });

    res.status(200).json({
      calendarId: createdCalendar.data.id,
      message: "A new calendar is created.",
    });
  } catch (error) {
    console.error("Error creating secondary calendar:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

function generateDarkColorHex() {
  // Function to generate a random number in a given range
  function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Generate each color component
  var r = randomInRange(0, 200); // Red component
  var g = randomInRange(0, 200); // Green component
  var b = randomInRange(0, 200); // Blue component

  // Convert each component to a hexadecimal string and pad with zero if necessary
  r = r.toString(16).padStart(2, "0");
  g = g.toString(16).padStart(2, "0");
  b = b.toString(16).padStart(2, "0");

  // Combine components into a full hex color string
  return "#" + r + g + b;
}

function calendarDescription(notes, appointment) {
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
