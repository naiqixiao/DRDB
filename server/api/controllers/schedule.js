const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");
const moment = require("moment");
const fs = require("fs");
// Create and Save an appointment

// {
//   "AppointmentTime": "2020-04-24T14:00:00.000",
//   "Status": "Confirmed",
//   "ScheduledBy": 5,
//   "summary": "test new API",
//   "Appointments": [
//       {
//           "FK_Study": 3,
//           "FK_Family": 208,
//           "FK_Child": 415,
//           "Experimenters": [1, 34]
//       },
//       {
//           "FK_Study": 7,
//           "FK_Family": 208,
//           "FK_Child": 416,
//           "Experimenters": [12, 14]
//       }
//   ],
//   "location": "Psychology Building, McMaster University",
//   "start": {
//       "dateTime": "2020-04-24T14:00:00.000",
//       "timeZone": "America/Toronto"
//   },
//   "end": {
//       "dateTime": "2020-04-24T15:30:00.000",
//       "timeZone": "America/Toronto"
//   },
//   "attendees": [
//       {
//           "email": "g.jaeger0226@gmail.com"
//       }
//   ]
// }

exports.create = asyncHandler(async (req, res) => {
  var newScheduleInfo = req.body;
  // if (newScheduleInfo.Status == "Confirmed") {
  //   // Create a calendar event
  //   const calEvent = await google.calendar.events.insert({
  //     calendarId: "primary",
  //     resource: newScheduleInfo,
  //     sendUpdates: "all",
  //   });

  //   newScheduleInfo.calendarEventId = calEvent.data.id;
  //   newScheduleInfo.eventURL = calEvent.data.htmlLink;
  // }

  try {
    const schedule = await model.schedule.create(newScheduleInfo, {
      include: [model.appointment],
    });

    var experimenterAssignment = [];
    for (var i = 0; i < schedule.Appointments.length; i++) {
      var appointmentId = schedule.Appointments[i].id;

      newScheduleInfo.Appointments[i].Experimenters.forEach((experimenter) => {
        experimenterAssignment.push({
          FK_Experimenter: experimenter,
          FK_Appointment: appointmentId,
        });
      });
    }

    await model.experimenterAssignment.bulkCreate(experimenterAssignment);

    // Log
    const User = req.body.User;

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder);
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_log.txt";
    } else {
      var logFile = logFolder + "/log.txt";
    }

    var logInfo =
      "[Appointment Created] " +
      User.Name +
      " (" +
      User.Email +
      ") " +
      "created a study appointment (" +
      schedule.id +
      ") at " +
      new Date().toString() +
      " - " +
      User.IP +
      "\r\n";

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo);
    } else {
      fs.writeFileSync(logFile, logInfo);
    }

    res.status(200).send(schedule);
    console.log("appointment created!");
  } catch (error) {
    throw error;
  }
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
  if (req.query.Status) {
    queryString.Status = { [Op.in]: req.query.Status };
  }
  if (req.query.AppointmentTimeBefore && req.query.AppointmentTimeAfter) {
    queryString.AppointmentTime = {
      [Op.between]: [
        new Date(req.query.AppointmentTimeAfter),
        new Date(req.query.AppointmentTimeBefore),
      ],
    };
  } else if (req.query.AppointmentTimeBefore) {
    queryString.AppointmentTime = {
      [Op.lte]: new Date(req.query.AppointmentTimeBefore),
    };
  } else if (req.query.AppointmentTimeAfter) {
    queryString.AppointmentTime = {
      [Op.gte]: new Date(req.query.AppointmentTimeAfter),
    };
  }

  if (req.query.trainingMode === "true") {
    queryString["$Family.TrainingSet$"] = true;
  } else {
    queryString["$Family.TrainingSet$"] = false;
  }

  if (req.query.Email) {
    queryString["$Family.Email$"] = {
      [Op.like]: `${req.query.Email}%`,
    };
  }
  if (req.query.NamePrimary) {
    queryString["$Family.NamePrimary$"] = {
      [Op.like]: `${req.query.NamePrimary}%`,
    };
  }
  if (req.query.NameSecondary) {
    queryString["$Family.NameSecondary$"] = {
      [Op.like]: `${req.query.NameSecondary}%`,
    };
  }
  if (req.query.Phone) {
    queryString["$Family.Phone$"] = {
      [Op.like]: `${req.query.Phone}%`,
    };
  }
  if (req.query.FamilyId) {
    queryString["$FK_Family$"] = req.query.FamilyId;
  }
  if (req.query.StudyName) {
    queryString["$Appointments.FK_Study$"] = req.query.StudyName;

    // {
    //   [Op.like]: `${req.query.StudyName}%`,
    // };
  }
  if (req.query.StudyId) {
    queryString["$Appointments.FK_Study$"] = req.query.StudyId;
  }

  if (req.query.lab) {
    queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;
  }

  try {
    const schedule = await model.schedule.findAll({
      where: queryString,
      include: [
        {
          model: model.appointment,
          include: [
            {
              model: model.child,
              attributes: ["Name", "DoB", "Sex", "IdWithinFamily"],
            },
            {
              model: model.study,
              attributes: [
                "StudyName",
                "MinAge",
                "MaxAge",
                "EmailTemplate",
                "StudyType",
                "FK_Lab",
              ],
            },
            {
              model: model.personnel,
              through: { model: model.experimenterAssignment },
              attributes: ["id", "Name", "Email", "Calendar", "ZoomLink"],
            },
          ],
        },
        {
          model: model.family,
        },
        {
          model: model.personnel,
        },
      ],
      order: [["AppointmentTime", "ASC"]],
    });
    res.status(200).send(schedule);
    console.log("Search successful!");
  } catch (error) {
    throw error;
  }
});

// Retrieve today's appointments from the database.
exports.today = asyncHandler(async (req, res) => {
  var queryString = {};

  queryString.AppointmentTime = {
    [Op.between]: [
      moment()
        .startOf("day")
        .toDate(),
      moment()
        .startOf("day")
        .add(1, "days")
        .toDate(),
    ],
  };

  if (req.query.trainingMode === "true") {
    queryString["$Family.TrainingSet$"] = true;
  } else {
    queryString["$Family.TrainingSet$"] = false;
  }

  if (req.query.lab) {
    queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;
  }

  try {
    const schedule = await model.schedule.findAll({
      where: queryString,
      include: [
        {
          model: model.appointment,
          include: [
            {
              model: model.child,
              attributes: ["Name", "DoB", "Sex", "IdWithinFamily"],
            },
            {
              model: model.study,
              attributes: [
                "StudyName",
                "MinAge",
                "MaxAge",
                "EmailTemplate",
                "StudyType",
                "FK_Lab",
              ],
            },
            {
              model: model.personnel,
              through: { model: model.experimenterAssignment },
              attributes: ["id", "Name", "Email", "Calendar", "ZoomLink"],
            },
          ],
        },
        {
          model: model.family,
        },
        {
          model: model.personnel,
        },
      ],
      order: [["AppointmentTime", "ASC"]],
    });
    res.status(200).send(schedule);
    console.log("Search successful!");
  } catch (error) {
    throw error;
  }
});

// Retrieve today's appointments from the database.
exports.week = asyncHandler(async (req, res) => {
  var queryString = {};

  queryString.AppointmentTime = {
    [Op.between]: [
      moment()
        .weekday(0)
        .startOf("day")
        .toDate(),
      moment()
        .weekday(7)
        .startOf("day")
        .toDate(),
    ],
  };

  if (req.query.trainingMode === "true") {
    queryString["$Family.TrainingSet$"] = true;
  } else {
    queryString["$Family.TrainingSet$"] = false;
  }

  if (req.query.lab) {
    queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;
  }

  try {
    const schedule = await model.schedule.findAll({
      where: queryString,
      include: [
        {
          model: model.appointment,
          include: [
            {
              model: model.child,
              attributes: ["Name", "DoB", "Sex", "IdWithinFamily"],
            },
            {
              model: model.study,
              attributes: [
                "StudyName",
                "MinAge",
                "MaxAge",
                "EmailTemplate",
                "StudyType",
                "FK_Lab",
              ],
            },
            {
              model: model.personnel,
              through: { model: model.experimenterAssignment },
              attributes: ["id", "Name", "Email", "Calendar", "ZoomLink"],
            },
          ],
        },
        {
          model: model.family,
        },
        {
          model: model.personnel,
        },
      ],
      order: [["AppointmentTime", "ASC"]],
    });
    res.status(200).send(schedule);
    console.log("Search successful!");
  } catch (error) {
    throw error;
  }
});

// Update an appointment by the id in the request
exports.update = asyncHandler(async (req, res) => {
  var updatedScheduleInfo = req.body;

  if (updatedScheduleInfo.id) {
    var ID = updatedScheduleInfo.id;
    delete updatedScheduleInfo["id"];
  }

  const calendar = google.calendar({
    version: "v3",
    auth: req.oAuth2Client,
  });

  switch (updatedScheduleInfo.Status) {
    case "Confirmed":
      if (updatedScheduleInfo.calendarEventId) {
        await calendar.events.patch({
          calendarId: "primary",
          eventId: updatedScheduleInfo.calendarEventId,
          resource: updatedScheduleInfo,
          sendUpdates: "all",
        });
      } else {
        // Create a calendar event
        const calEvent = await calendar.events.insert({
          calendarId: "primary",
          resource: updatedScheduleInfo,
          sendUpdates: "all",
        });

        updatedScheduleInfo.calendarEventId = calEvent.data.id;
        updatedScheduleInfo.eventURL = calEvent.data.htmlLink;

        // res.status(200).send({
        //   calendarEventId: calEvent.data.id,
        //   eventURL: calEvent.data.htmlLink
        // });
      }

      break;

    default:
      // update the calendar event, if an appointment is rescheduled.

      if (updatedScheduleInfo.calendarEventId) {
        // check if there was an calendar event created before.

        try {
          await calendar.events.patch({
            calendarId: "primary",
            eventId: updatedScheduleInfo.calendarEventId,
            resource: updatedScheduleInfo,
            sendUpdates: "all",
          });
        } catch (err) {
          throw err;
        }

        updatedScheduleInfo.AppointmentTime = null;
      }

      break;
  }

  try {
    const updatedSchedule = await model.schedule.update(updatedScheduleInfo, {
      where: { id: ID },
      include: [
        {
          model: model.family,
        },
        {
          model: model.appointment,
          include: [
            {
              model: model.child,
              attributes: ["Name", "DoB", "Sex", "IdWithinFamily"],
            },
            {
              model: model.study,
              attributes: [
                "StudyName",
                "MinAge",
                "MaxAge",
                "EmailTemplate",
                "StudyType",
              ],
            },

            {
              model: model.personnel,
              through: { model: model.experimenterAssignment },
              attributes: ["id", "Name", "Email", "Calendar", "ZoomLink"],
            },
          ],
        },
      ],
    });

    // Log
    const User = req.body.User;

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder);
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_log.txt";
    } else {
      var logFile = logFolder + "/log.txt";
    }

    var logInfo =
      "[Appointment Update] " +
      User.Name +
      " (" +
      User.Email +
      ") " +
      "updated a study appointment (" +
      ID +
      ") at " +
      new Date().toString() +
      " - " +
      User.IP +
      "\r\n";

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo);
    } else {
      fs.writeFileSync(logFile, logInfo);
    }

    res.status(200).send(updatedSchedule);

    console.log("Appointment Information Updated.");
  } catch (error) {
    console.log("Appointment update error: " + error);
    throw error;
  }
});

exports.remind = asyncHandler(async (req, res) => {
  var updatedScheduleInfo = req.body;

  if (updatedScheduleInfo.id) {
    var ID = updatedScheduleInfo.id;
    delete updatedScheduleInfo["id"];
  }

  try {
    const updatedSchedule = await model.schedule.update(updatedScheduleInfo, {
      where: { id: ID },
    });

    // Log
    const User = req.body.User;

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder);
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_log.txt";
    } else {
      var logFile = logFolder + "/log.txt";
    }

    var logInfo =
      "[Appointment Remind] " +
      User.Name +
      " (" +
      User.Email +
      ") " +
      "sent a reminding email for a study appointment (" +
      ID +
      ") at " +
      new Date().toString() +
      " - " +
      User.IP +
      "\r\n";

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo);
    } else {
      fs.writeFileSync(logFile, logInfo);
    }

    res.status(200).send(updatedSchedule);

    console.log("Appointment Reminder Updated.");
  } catch (error) {
    console.log("Appointment update error: " + error);
    throw error;
  }
});

exports.complete = asyncHandler(async (req, res) => {
  var updatedScheduleInfo = req.body;

  if (updatedScheduleInfo.id) {
    var ID = updatedScheduleInfo.id;
    delete updatedScheduleInfo["id"];
  }

  try {
    const updatedSchedule = await model.schedule.update(updatedScheduleInfo, {
      where: { id: ID },
    });

    // update family by removing AssignedLab from the family
    updateFamilyInfo = { AssignedLab: null };

    await model.family.update(updateFamilyInfo, {
      where: { id: updatedScheduleInfo.FK_Family },
    });

    // Log
    const User = req.body.User;

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder);
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_log.txt";
    } else {
      var logFile = logFolder + "/log.txt";
    }

    var logInfo =
      "[Appointment Complete] " +
      User.Name +
      " (" +
      User.Email +
      ") " +
      "marked the study appointment (" +
      ID +
      ") as completed at " +
      new Date().toString() +
      " - " +
      User.IP +
      "\r\n";

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo);
    } else {
      fs.writeFileSync(logFile, logInfo);
    }

    res.status(200).send(updatedSchedule);

    console.log("Appointment Information Updated.");
  } catch (error) {
    console.log("Appointment update error: " + error);
    throw error;
  }
});

// Delete an appointment with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  try {
    const schedule = await model.schedule.findOne({
      where: { id: req.query.id },
    });

    const calendar = google.calendar({ version: "v3", auth: req.oAuth2Client });

    // remove calendar event, if it exists.
    if (schedule.calendarEventId) {
      await calendar.events.delete({
        calendarId: "primary",
        eventId: schedule.calendarEventId,
        sendUpdates: "all",
      });
    }

    await model.schedule.destroy({
      where: { id: req.query.id },
    });

    // Log
    var User = JSON.parse(req.query.User);

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder);
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_log.txt";
    } else {
      var logFile = logFolder + "/log.txt";
    }

    var logInfo =
      "[Appointment Delete] " +
      User.Name +
      " (" +
      User.Email +
      ") " +
      "deleted a study appointment (" +
      req.query.id +
      ") " +
      new Date().toString() +
      " - " +
      User.IP +
      "\r\n";

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo);
    } else {
      fs.writeFileSync(logFile, logInfo);
    }

    res.status(200).send("schedule deleted.");
  } catch (error) {
    throw error;
  }
});

exports.special = asyncHandler(async (req, res) => {
  var queryString = {};
  queryString["$Appointments.Study.FK_Lab$"] = 2;

  try {
    var schedules = await model.schedule.findAll({
      where: queryString,
      include: [
        {
          model: model.appointment,
          include: [
            {
              model: model.child,
              attributes: ["Name", "DoB", "Sex", "IdWithinFamily"],
            },
            {
              model: model.study,
              attributes: [
                "StudyName",
                "MinAge",
                "MaxAge",
                "EmailTemplate",
                "StudyType",
                "FK_Lab",
              ],
            },
            {
              model: model.personnel,
              through: { model: model.experimenterAssignment },
              attributes: ["id", "Name", "Email", "Calendar", "ZoomLink"],
            },
          ],
        },
        {
          model: model.family,
        },
        {
          model: model.personnel,
        },
      ],
    });

    schedules.forEach((schedule) => {
      // if (schedule.Appointments[0].FK_Family) {

      //   var x = {};
      //   x.FK_Family = schedule.Appointments[0].FK_Family;

      //   await model.schedule.update(x, { where: { id: schedule.id } })

      // }
      schedule.Appointments.forEach(async (appointment) => {
        var x = {};
        x.FK_Family = schedule.FK_Family;
        await model.appointment.update(x, { where: { id: appointment.id } });
      });
    });

    res.status(200).send(schedules);
    console.log("Search successful!");
  } catch (error) {
    throw error;
  }
});
