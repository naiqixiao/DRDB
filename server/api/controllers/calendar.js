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
  console.log(event);
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
    for (const app of event.Appointments) {
      const calendarId = app.calendarId;
      const calEvent = await calendar.events.insert({
        calendarId: calendarId,
        resource: event,
        sendNotifications: true,
      });
      const appointmentInfo = await model.appointment.findOne({
        where: {FK_Study: app.FK_Study,
                FK_Child: app.FK_Child}
      });
  
      var updatedAppointmentInfo = {};
      updatedAppointmentInfo.calendarEventId = calEvent.data.id;
      updatedAppointmentInfo.eventURL = calEvent.data.htmlLink;
  
      await model.appointment.update(updatedAppointmentInfo, {
        where: { id: appointmentInfo.dataValues.id },
      });
  
      console.log("Calendar event successfully created: " + calEvent.data.id);
    }
    res.status(200).send('calendar event created');
  } catch (error) {
    console.log('*****', error);
    throw error;
  }
});

exports.update = asyncHandler(async (req, res) => {
  const event = req.body;
  const calendar = google.calendar({ version: "v3", auth: req.oAuth2Client });

  try {
    const calEvent = await calendar.events.patch({
      calendarId: event.appointment.calendarId,
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
  const calendar = google.calendar({ version: "v3", auth: req.oAuth2Client });
  
  try {
    const Schedule = await model.schedule.findOne({
      where: { id: req.query.FK_Schedule },
    });

    if (Schedule.calendarEventId) {
      calendar.events.delete({
        calendarId: 'primary',
        eventId: Schedule.calendarEventId
      });
      await model.schedule.update({eventURL: null, calendarEventId: null}, {where: {id: req.query.FK_Schedule}});
      return;
    }

    const Appointment = await model.appointment.findOne({
      where: { id: req.query.id },
    });
    
    const TestingRooms = await model.testingRoom.findAll({
      where: {FK_Lab: req.query.lab},
    });

    const Study = await model.study.findOne({
      where: { id: Appointment.FK_Study },
    });

    
    const testingRoomId = Study.FK_TestingRoom;
    const curTestingRoom = TestingRooms.find(room => room.id === testingRoomId);
    const calId = curTestingRoom.calendarId;

    if (Appointment.calendarEventId) {
      calendar.events.delete({
        calendarId: calId,
        eventId: Appointment.calendarEventId
      });
    }
    
    await model.appointment.update({eventURL: null, calendarEventId: null}, {where: {id: req.query.id}});

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
      },
    });
    
    res.status(200).json({ calendarId: createdCalendar.data.id, message: 'A new calendar is created.' });

  } catch (error) {
    console.error('Error creating secondary calendar:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});