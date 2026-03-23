const asyncHandler = require("express-async-handler");
const model = require("../models/DRDB");

const calendarService = require("../services/googleCalendarService");

// a new calendar event creation function to generate a list of events for each appointment, and then send the output back to frontend.
exports.create = asyncHandler(async (req, res) => {
  try {
    const event = await calendarService.createEvent(
      req.oAuth2Client,
      req.body.event
    );
    res.status(200).send(event);
  } catch (error) {
    console.error("Calendar create error:", error);
    if (res) res.status(500).json({ error: error.message });
  }
});

exports.update = asyncHandler(async (req, res) => {
  try {
    const event = await calendarService.updateEvent(
      req.oAuth2Client,
      req.body.event
    );
    res.status(200).send(event);
  } catch (error) {
    console.error("Calendar update error:", error);
    if (res) res.status(500).json({ error: error.message });
  }
});

exports.delete = asyncHandler(async (req, res) => {
  try {
    const Schedule = await model.schedule.findOne({
      where: { id: req.query.FK_Schedule },
    });

    if (Schedule.calendarEventId) {
      await calendarService.deleteEvent(
        req.oAuth2Client,
        "primary",
        Schedule.calendarEventId
      );
      await model.schedule.update(
        { eventURL: null, calendarEventId: null },
        { where: { id: req.query.FK_Schedule } }
      );
      return;
    }

    let Appointment;
    if (!req.query.id || req.query.id === "undefined" || req.query.id === "null") {
      // Find one of the appointments belonging to this schedule
      Appointment = await model.appointment.findOne({
        where: { FK_Schedule: req.query.FK_Schedule },
      });
    } else {
      Appointment = await model.appointment.findOne({
        where: { id: req.query.id },
      });
    }

    if (!Appointment) {
      // If we completely fail to find the appointment, safely attempt primary calendar
      if (req.query.eventId) {
        try {
          await calendarService.deleteEvent(
            req.oAuth2Client,
            "primary",
            req.query.eventId
          );
        } catch(e) { /* ignore */ }
      }
      return res.status(200).send("Calendar event deleted (or ignored due to missing Appointment)");
    }

    const TestingRooms = await model.testingRoom.findAll({
      where: { FK_Lab: req.query.lab },
    });

    const Study = await model.study.findOne({
      where: { id: Appointment.FK_Study },
    });

    const testingRoomId = Study.FK_TestingRoom;
    let calId;
    if (testingRoomId) {
      const curTestingRoom = TestingRooms.find(
        (room) => room.id === testingRoomId
      );
      calId = curTestingRoom.calendarId;
    } else {
      calId = "primary";
    }

    if (Appointment.calendarEventId) {
      await calendarService.deleteEvent(
        req.oAuth2Client,
        calId,
        Appointment.calendarEventId
      );
    }

    await model.appointment.update(
      { eventURL: null, calendarEventId: null },
      { where: { id: req.query.id } }
    );

    console.log("Calendar event successfully deleted.");
    res.status(200).send("Calendar event successfully deleted.");
  } catch (error) {
    console.error("Calendar delete error:", error);
    res.status(500).json({ error: error.message });
  }
});

exports.createSecondaryCalendar = asyncHandler(async (req, res) => {
  try {
    const result = await calendarService.createSecondaryCalendar(
      req.oAuth2Client,
      req.body.calendarName
    );

    res.status(200).json({
      calendarId: result.calendarId,
      message: "A new calendar is created.",
    });
  } catch (error) {
    console.error("Error creating secondary calendar:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
