const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const google = require("../middleware/calendar");

// Create and Save an appointment

// {
//   "AppointmentTime": "2020-03-24T14:00:00.000",
//   "Status": "Confirmed",
//   "FK_Study": 4,
//   "FK_Family": 118,
//   "FK_Child": 236,
//   "ScheduledBy": 5,
//   "location": "Psychology Building, McMaster University",
//   "start": {
//       "dateTime": "2020-03-24T14:00:00.000",
//       "timeZone": "America/Toronto"
//   },
//   "end": {
//       "dateTime": "2020-03-24T15:30:00.000",
//       "timeZone": "America/Toronto"
//   },
//   "attendees": [
//       {
//           "email": "g.jaeger0226@gmail.com"
//       }
//   ]
// }

exports.create = asyncHandler(async (req, res) => {
  var newAppointmentInfo = req.body;

  if (newAppointmentInfo.Status == "Confirmed") {
    const study = await model.study.findOne({
      attributes: ["StudyName"],
      where: { id: newAppointmentInfo.FK_Study }
    });

    newAppointmentInfo.summary =
      study.StudyName +
      ", Family: " +
      newAppointmentInfo.FK_Family +
      ", Child: " +
      newAppointmentInfo.FK_Child;

    // const child = await model.child.findOne({
    //   attributes: ["DoB"],
    //   where: { id: newAppointmentInfo.FK_Child }
    // });

    // newAppointmentInfo.AgeByParticipation = Math.floor(
    //   (new Date(newAppointmentInfo.AppointmentTime) - new Date(child.DoB)) /
    //     (1000 * 3600 * 24)
    // );

    // Create a calendar event
    const calEvent = await google.calendar.events.insert({
      calendarId: "primary",
      resource: newAppointmentInfo,
      sendUpdates: "all"
    });

    newAppointmentInfo.calendarEventId = calEvent.data.id;
    newAppointmentInfo.eventURL = calEvent.data.htmlLink;
  } else {
    newAppointmentInfo.AgeByParticipation = 9999;
  }

  const appointment = await model.appointment.create(newAppointmentInfo, {
    include: [model.family, model.child, model.study]
  });

  res.status(200).send(appointment);
  console.log("appointment created " + appointment.id);
});

// Retrieve appointments from the database.
exports.search = asyncHandler(async (req, res) => {
  var queryString = {};

  if (req.query.id) {
    queryString.id = req.query.id;
  }
  if (req.query.StudyId) {
    queryString.FK_Study = req.query.StudyId;
  }
  if (req.query.FamilyId) {
    queryString.FK_Family = req.query.FamilyId;
  }
  if (req.query.Status) {
    queryString.Status = { [Op.in]: JSON.parse(req.query.Status) };
  }
  if (req.query.AppointmentTimeAfter) {
    queryString.AppointmentTime = {
      [Op.gte]: new Date(req.query.AppointmentTimeAfter)
    };
  }
  if (req.query.AppointmentTimeBefore) {
    queryString.AppointmentTime = {
      [Op.lte]: new Date(req.query.AppointmentTimeBefore)
    };
  }

  if (req.query.Email) {
    queryString["$Family.Email$"] = { [Op.like]: `${req.query.Email}%` };
  }
  if (req.query.NameMom) {
    queryString["$Family.NameMom$"] = { [Op.like]: `${req.query.NameMom}%` };
  }
  if (req.query.NameDad) {
    queryString["$Family.NameDad$"] = { [Op.like]: `${req.query.NameDad}%` };
  }
  if (req.query.Phone) {
    queryString["$Family.Phone$"] = { [Op.like]: `${req.query.Phone}%` };
  }
  if (req.query.FamilyId) {
    queryString["$Family.id$"] = req.query.FamilyId;
  }

  const appointment = await model.appointment.findAll({
    where: queryString,
    include: [model.family, model.child, model.study]
  });
  res.status(200).send(appointment);
  console.log("Search successful!");
});

// Retrieve today's appointments from the database.
exports.today = asyncHandler(async (req, res) => {
  var queryString = {};

  if (req.query.Status) {
    queryString.Status = { [Op.in]: JSON.parse(req.query.Status) };
  }

  queryString.AppointmentTime = {
    [Op.between]: [
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate()
      ),
      new Date(
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate()
        ).getTime() +
          24 * 60 * 60 * 1000
      )
    ]
  };

  const appointment = await model.appointment.findAll({
    where: queryString,
    include: [model.family, model.child, model.study]
  });
  res.status(200).send(appointment);
  console.log("Search successful!");
});

// Update an appointment by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var updatedAppointmentInfo = req.body;

  if (updatedAppointmentInfo.id) {
    var ID = updatedAppointmentInfo.id;
    delete updatedAppointmentInfo["id"];
  }
  if (!updatedAppointmentInfo.Completed) {
    switch (updatedAppointmentInfo.Status) {
      case "Confirmed": {
        updatedAppointmentInfo.summary =
          updatedAppointmentInfo.Study.StudyName +
          ", Family: " +
          updatedAppointmentInfo.FK_Family +
          ", Child: " +
          updatedAppointmentInfo.FK_Child;

        console.log(JSON.stringify(updatedAppointmentInfo));

        if (updatedAppointmentInfo.calendarEventId) {
          await google.calendar.events.patch({
            calendarId: "primary",
            eventId: updatedAppointmentInfo.calendarEventId,
            resource: updatedAppointmentInfo,
            sendUpdates: "all"
          });
        } else {
          // Create a calendar event
          const calEvent = await google.calendar.events.insert({
            calendarId: "primary",
            resource: updatedAppointmentInfo,
            sendUpdates: "all"
          });

          updatedAppointmentInfo.calendarEventId = calEvent.data.id;
          updatedAppointmentInfo.eventURL = calEvent.data.htmlLink;
        }

        break;
      }

      case "No Show":
      case "TBD":
      case "Rescheduling":
      case "Cancelled":
      case "Rejected": {
        // update the calendar event, if an appointment is rescheduled.
        if (updatedAppointmentInfo.calendarEventId) {
          // check if there was an calendar event created before.

          updatedAppointmentInfo.summary =
            updatedAppointmentInfo.Status.toUpperCase() +
            " - " +
            updatedAppointmentInfo.Study.StudyName +
            ", Family: " +
            updatedAppointmentInfo.FK_Family +
            ", Child: " +
            updatedAppointmentInfo.FK_Child;

          try {
            await google.calendar.events.patch({
              calendarId: "primary",
              eventId: updatedAppointmentInfo.calendarEventId,
              resource: updatedAppointmentInfo,
              sendUpdates: "all"
            });
          } catch (err) {
            throw err;
          }

          updatedAppointmentInfo.AppointmentTime = null;
        }

        break;
      }
    }
  }

  try {
    const updatedAppointment = await model.appointment.update(
      updatedAppointmentInfo,
      {
        where: { id: ID },
        include: [model.family, model.child, model.study]
      }
    );

    // console.log(JSON.stringify(updatedAppointment));
    res.status(200).send(updatedAppointment);

    console.log("Appointment Information Updated.");
  } catch (error) {
    console.log("Appointment update error:" + error);
  }
});

// Delete an appointment with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  const appointment = await model.appointment.findOne({
    where: req.query
  });

  // remove calendar event, if it exists.
  if (appointment.calendarEventId) {
    await google.calendar.events.delete({
      calendarId: "primary",
      eventId: appointment.calendarEventId,
      sendUpdates: "all"
    });
  }

  await model.appointment.destroy({
    where: req.query
  });

  res.status(200).send("appointment deleted.");
});
