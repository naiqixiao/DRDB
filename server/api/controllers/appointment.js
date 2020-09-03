const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");
const fs = require("fs");
// {
//             "FK_Schedule": 35,
//             "FK_Study": 3,
//             "FK_Family": 208,
//             "FK_Child": 415
//         }

// add an appointment (child, family, & study) to an existing schedule.
exports.create = asyncHandler(async (req, res) => {
  var newAppointmentInfo = req.body.appointment;

  try {
    const appointments = await model.appointment.bulkCreate(newAppointmentInfo);

    // update experimenter assignment
    var experimenterAssignment = [];
    for (var i = 0; i < appointments.length; i++) {
      var appointmentId = appointments[i].id;

      newAppointmentInfo[i].Experimenters.forEach((experimenter) => {
        experimenterAssignment.push({
          FK_Experimenter: experimenter,
          FK_Appointment: appointmentId,
        });
      });
    }

    await model.experimenterAssignment.bulkCreate(experimenterAssignment);

    // update calendar event
    const Schedule = await model.schedule.findOne({
      where: { id: appointments[0].FK_Schedule },
      include: [
        {
          model: model.appointment,
          include: [
            { model: model.family, attributes: ["id", "Email", "NameMom"] },
            {
              model: model.child,
              attributes: ["Name", "DoB", "Sex", "IdWithinFamily"],
            },
            {
              model: model.study,
              attributes: ["StudyName", "MinAge", "MaxAge", "StudyType", "FK_Lab", "EmailTemplate"],
            },
            {
              model: model.personnel,
              through: { model: model.experimenterAssignment },
              attributes: ["id", "Name", "Email", "Calendar"],
            },
          ],
        },
      ],
    });

    var studyNames = Schedule.Appointments.map((appointment) => {
      return (
        appointment.Study.StudyName +
        " (" +
        appointment.FK_Family +
        appointment.Child.IdWithinFamily +
        ")"
      );
    });

    studyNames = Array.from(new Set(studyNames));

    var attendees = [];

    Schedule.Appointments.forEach((appointment) => {
      appointment.Personnels.forEach((experimenter) => {
        attendees.push({
          displayName: experimenter.Name,
          email: experimenter.Calendar, // + ".CAL",
        });
      });
    });

    const updatedScheduleInfo = {
      summary: studyNames.join(" + "),
      attendees: attendees,
    };

    try {
      const calendar = google.calendar({
        version: "v3",
        auth: req.oAuth2Client,
      });

      await calendar.events.patch({
        calendarId: "primary",
        eventId: Schedule.calendarEventId,
        resource: updatedScheduleInfo,
        sendUpdates: "all",
      });
    } catch (error) {
      throw error;
    }

    // Log
    const User = req.body.User;

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder)
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_log.txt";

    } else {
      var logFile = logFolder + "/log.txt";
    }

    var logInfo = "[Appointment Added] " + User.Name + " (" + User.Email + ") " + "added a study appointment to a schedule (" +
      Schedule.id + ") at " +
      new Date().toString() + " - " + User.IP + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

    res.status(200).send(Schedule);
  } catch (error) {
    res.status(500).send(error);
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
  if (req.query.FamilyId) {
    queryString.FK_Family = req.query.FamilyId;
  }
  if (req.query.ChildId) {
    queryString.FK_Child = { [Op.in]: req.query.ChildId };
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
  if (req.query.ChildName) {
    queryString["$Child.Name$"] = { [Op.like]: `${req.query.ChildName}%` };
  }
  if (req.query.StudyName) {
    queryString["$Study.StudyName$"] = { [Op.like]: `${req.query.StudyName}%` };
  }

  const appointment = await model.appointment.findAll({
    where: queryString,
    include: [
      { model: model.family, attributes: ["id", "Email", "NameMom"] },
      { model: model.child, attributes: ["Name", "DoB", "Sex", "IdWithinFamily"] },
      {
        model: model.study,
        attributes: ["StudyName", "MinAge", "MaxAge", "StudyType", "FK_Lab", "EmailTemplate"],

      },
      {
        model: model.personnel,
        through: { model: model.experimenterAssignment },
        attributes: ["id", "Name", "Email", "Calendar"],
      },
    ],
  });
  res.status(200).send(appointment);
  console.log("Search successful!");
});

// Update an appointment by the id in the request
// exports.update = asyncHandler(async (req, res) => {
//   var updatedAppointmentInfo = req.body;

//   if (updatedAppointmentInfo.id) {
//     var ID = updatedAppointmentInfo.id;
//     delete updatedAppointmentInfo["id"];
//   }

//   try {
//     const updatedAppointment = await model.appointment.update(
//       updatedAppointmentInfo,
//       {
//         where: { id: ID }
//       }
//     );

//     res.status(200).send(updatedAppointment);

//     console.log("Appointment Information Updated.");
//   } catch (error) {
//     console.log("Appointment update error:" + error);
//   }
// });

exports.update = asyncHandler(async (req, res) => {
  const updatedAppointmentInfo = req.body.updatedExperimenters;

  try {
    await model.experimenterAssignment.destroy({
      where: { FK_Appointment: updatedAppointmentInfo[0].FK_Appointment },
    });

    await model.experimenterAssignment.bulkCreate(updatedAppointmentInfo);

    // // update calendar event
    const Schedule = await model.schedule.findOne({
      where: { id: req.body.scheduleId },
      include: [
        {
          model: model.appointment,
          include: [
            { model: model.family, attributes: ["id", "Email", "NameMom"] },
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
                "StudyType",
                "FK_Lab",
                "EmailTemplate"
              ],
            },
            {
              model: model.personnel,
              through: { model: model.experimenterAssignment },
              attributes: ["id", "Name", "Email", "Calendar"],
            },
          ],
        },
      ],
    });

    var studyNames = Schedule.Appointments.map((appointment) => {
      return (
        appointment.Study.StudyName +
        " (" +
        appointment.FK_Family +
        appointment.Child.IdWithinFamily +
        ")"
      );
    });

    studyNames = Array.from(new Set(studyNames));

    var attendees = [];

    Schedule.Appointments.forEach((appointment) => {
      appointment.Personnels.forEach((experimenter) => {
        attendees.push({
          displayName: experimenter.Name,
          email: experimenter.Calendar, // + ".CAL",
        });
      });
    });

    const updatedScheduleInfo = {
      summary: studyNames.join(" + "),
      attendees: attendees,
    };

    try {
      const calendar = google.calendar({
        version: "v3",
        auth: req.oAuth2Client,
      });

      await calendar.events.patch({
        calendarId: "primary",
        eventId: Schedule.calendarEventId,
        resource: updatedScheduleInfo,
        sendUpdates: "all",
      });
    } catch (err) {
      throw err;
    }

    // Log
    const User = req.body.User;

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder)
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_log.txt";

    } else {
      var logFile = logFolder + "/log.txt";
    }

    var logInfo = "[Appointment Updated] " + User.Name + " (" + User.Email + ") " + "added a study appointment (" +
      Schedule.id + ") at " +
      new Date().toString() + " - " + User.IP + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

    res.status(200).send(Schedule);

    console.log("Appointment Information Updated.");
  } catch (error) {
    console.log("Appointment update error:" + error);
  }
});

// Delete an appointment with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  try {
    const Schedule = await model.schedule.findOne({
      where: { id: req.query.FK_Schedule },
      include: [
        {
          model: model.appointment,
          include: [
            { model: model.family, attributes: ["id", "Email", "NameMom"] },
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
                "StudyType",
                "FK_Lab",
                "EmailTemplate"
              ],
            },
            {
              model: model.personnel,
              through: { model: model.experimenterAssignment },
              attributes: ["id", "Name", "Email", "Calendar"],
            },
          ],
        },
      ],
    });

    var updatedAppointments = Schedule.Appointments.filter(
      (appointment) => appointment.id != req.query.id
    );

    var studyNames = updatedAppointments.map((appointment) => {
      return (
        appointment.Study.StudyName +
        " (" +
        appointment.FK_Family +
        appointment.Child.IdWithinFamily +
        ")"
      );
    });

    studyNames = Array.from(new Set(studyNames));

    var attendees = [];

    updatedAppointments.forEach((appointment) => {
      appointment.Personnels.forEach((experimenter) => {
        attendees.push({
          displayName: experimenter.Name,
          email: experimenter.Calendar, // + ".CAL",
        });
      });
    });

    const updatedScheduleInfo = {
      summary: studyNames.join(" + "),
      attendees: attendees,
    };

    try {
      const calendar = google.calendar({
        version: "v3",
        auth: req.oAuth2Client,
      });

      await calendar.events.patch({
        calendarId: "primary",
        eventId: Schedule.calendarEventId,
        resource: updatedScheduleInfo,
        // sendUpdates: "all"
      });
    } catch (err) {
      throw err;
    }

    await model.appointment.destroy({
      where: { id: req.query.id },
    });

    // Log
    var User = JSON.parse(req.query.User);

    const logFolder = "api/logs";
    if (!fs.existsSync(logFolder)) {
      fs.mkdirSync(logFolder)
    }

    if (User.LabName) {
      var logFile = logFolder + "/" + User.LabName + "_log.txt";

    } else {
      var logFile = logFolder + "/log.txt";
    }

    var logInfo = "[Appointment Delete] " + User.Name + " (" + User.Email + ") " + "delelete a study appointment to a schedule (" +
      Schedule.id + ") at " +
      new Date().toString() + " - " + User.IP + "\r\n"

    if (fs.existsSync(logFile)) {
      fs.appendFileSync(logFile, logInfo)
    } else {
      fs.writeFileSync(logFile, logInfo)
    }

    res.status(200).send({
      AppointmentTime: Schedule.AppointmentTime
    });
  } catch (error) {
    res.status(500).send(error);
  }
});
