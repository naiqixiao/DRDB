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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

exports.delete = asyncHandler(async (req, res) => {
  try {
    const Schedule = await model.schedule.findOne({
      where: { id: req.query.FK_Schedule },
    });

    if (Schedule.eventId) {
      await calendarService.deleteEvent(
        req.oAuth2Client,
        "primary",
        Schedule.eventId
      );
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
      const curTestingRoom = TestingRooms.find(
        (room) => room.id === testingRoomId
      );
      calId = curTestingRoom.calendarId;
    } else {
      calId = "primary";
    }

    if (Appointment.eventId) {
      await calendarService.deleteEvent(
        req.oAuth2Client,
        calId,
        Appointment.eventId
      );
    }

    await model.appointment.update(
      { eventURL: null, eventId: null },
      { where: { id: req.query.id } }
    );

    console.log("Calendar event successfully deleted.");
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
