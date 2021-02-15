const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");
const fs = require("fs");
const log = require("../controllers/log");

// {
//             "FK_Schedule": 35,
//             "FK_Study": 3,
//             "FK_Family": 208,
//             "FK_Child": 415
//         }

// add an appointment (child, family, & study) to an existing schedule.
exports.create = asyncHandler(async (req, res) => {
  var newAppointmentInfo = req.body.appointment;
  // console.log(newAppointmentInfo);

  try {
    const appointments = await model.appointment.bulkCreate(newAppointmentInfo);

    // update experimenter assignment
    var experimenterAssignment = [];

    // update secondary experimenters
    var experimenterAssignment_2nd = [];

    for (var i = 0; i < appointments.length; i++) {
      var appointmentId = appointments[i].id;

      newAppointmentInfo[i].Experimenters.forEach((experimenter) => {
        experimenterAssignment.push({
          FK_Experimenter: experimenter,
          FK_Appointment: appointmentId,
        });
      });

      newAppointmentInfo[i].Experimenters_2nd.forEach((experimenter_2nd) => {
        experimenterAssignment_2nd.push({
          FK_Experimenter: experimenter_2nd,
          FK_Appointment: appointmentId,
        });
      });
    }

    await model.experimenterAssignment.bulkCreate(experimenterAssignment);

    await model.experimenterAssignment_2nd.bulkCreate(
      experimenterAssignment_2nd
    );

    // update calendar event
    var Schedule = await model.schedule.findOne({
      where: { id: appointments[0].FK_Schedule },
      include: [
        {
          model: model.appointment,
          include: [
            { model: model.family },
            {
              model: model.child,
            },
            {
              model: model.study,
            },
            {
              model: model.personnel,
              as: "PrimaryExperimenter",
              through: { model: model.experimenterAssignment },
            },
            {
              model: model.personnel,
              as: "SecondaryExperimenter",
              through: { model: model.experimenterAssignment_2nd },
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
      appointment.PrimaryExperimenter.forEach((experimenter) => {
        attendees.push({
          displayName: experimenter.Name,
          email: experimenter.Calendar, // + ".CAL",
        });
      });
      appointment.SecondaryExperimenter.forEach((experimenter) => {
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
        sendNotifications: true,
      });
    } catch (error) {
      throw error;
    }

    // Update Schedule updatedAt
    Schedule.dataValues.updatedAt = new Date();

    await model.schedule.update(
      { Note: Schedule.Note + "" },
      {
        where: { id: Schedule.id },
      }
    );

    // Log
    const User = req.body.User;

    await log.createLog("Appointment Added", User, "added a study appointment to a schedule(" +
      Schedule.id +
      ")");

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
      { model: model.family, attributes: ["id", "Email", "NamePrimary"] },
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
          "EmailTemplate",
          "ReminderTemplate",
        ],
      },
      {
        model: model.personnel,
        as: "PrimaryExperimenter",
        through: { model: model.experimenterAssignment },
        attributes: ["id", "Name", "Email", "Calendar", "ZoomLink", "Initial"],
      },
      {
        model: model.personnel,
        as: "SecondaryExperimenter",
        through: { model: model.experimenterAssignment_2nd },
        attributes: ["id", "Name", "Email", "Calendar", "ZoomLink", "Initial"],
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
  const updatedAppointmentInfo_2nd = req.body.updatedExperimenters_2nd;

  try {
    await model.experimenterAssignment.destroy({
      where: { FK_Appointment: updatedAppointmentInfo.FK_Appointment },
    });

    await model.experimenterAssignment.create(updatedAppointmentInfo);

    await model.experimenterAssignment_2nd.destroy({
      where: { FK_Appointment: updatedAppointmentInfo_2nd[0].FK_Appointment },
    });

    if (updatedAppointmentInfo_2nd.length > 0) {

      await model.experimenterAssignment_2nd.bulkCreate(
        updatedAppointmentInfo_2nd
      );

    }

    // update calendar event
    var Schedule = await model.schedule.findOne({
      where: { id: req.body.scheduleId },
      include: [
        {
          model: model.appointment,
          include: [
            { model: model.family },
            {
              model: model.child,
            },
            {
              model: model.study,
            },
            {
              model: model.personnel,
              as: "PrimaryExperimenter",
              through: { model: model.experimenterAssignment },
            },
            {
              model: model.personnel,
              as: "SecondaryExperimenter",
              through: { model: model.experimenterAssignment_2nd },
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
    var description = "<b>Note: </b>" + Schedule.Note + "<br>";

    Schedule.Appointments.forEach((appointment) => {
      appointment.PrimaryExperimenter.forEach((experimenter) => {
        attendees.push({
          displayName: experimenter.Name,
          email: experimenter.Calendar,
        });
      });

      appointment.SecondaryExperimenter.forEach((experimenter) => {
        attendees.push({
          displayName: experimenter.Name,
          email: experimenter.Calendar,
        });
      });

      appointment.E1 = appointment.PrimaryExperimenter[0].Name +
        " (" +
        appointment.PrimaryExperimenter[0].Email +
        ")"

      const experimenterNames_2nd = appointment.SecondaryExperimenter.map(
        (experimenter) => {
          return experimenter.Name + " (" + experimenter.Email + ")";
        }
      );

      appointment.E2 = experimenterNames_2nd.join(", "),

        description =
        description +
        "<br>==================" +
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

    });


    const updatedScheduleInfo = {
      summary: studyNames.join(" + "),
      description: description,
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
        sendNotifications: true,
      });
    } catch (err) {
      throw err;
    }

    Schedule.dataValues.updatedAt = new Date();

    // Log
    const User = req.body.User;

    await log.createLog("Appointment Updated", User, "updated experimenters in study appointment");

    res.status(200).send(Schedule);

    console.log("Appointment Information Updated.");
  } catch (error) {
    console.log("Appointment update error:" + error);
  }
});

exports.updateExperimenters = asyncHandler(async (req, res) => {
  const updatedAppointmentInfo = req.body.updatedExperimenters;
  const updatedAppointmentInfo_2nd = req.body.updatedExperimenters_2nd;
  const calendarId = req.body.calendarId;
  const appointmentId = req.body.appointmentId;

  const experimenterId = {
    FK_Appointment: appointmentId,
    FK_Experimenter: updatedAppointmentInfo.id,
  };

  const experimenterIds_2nd = updatedAppointmentInfo_2nd.map(
    (experimenter) => {
      return {
        FK_Appointment: appointmentId,
        FK_Experimenter: experimenter.id,
      };
    }
  );

  try {
    await model.experimenterAssignment.destroy({
      where: { FK_Appointment: appointmentId },
    });

    await model.experimenterAssignment.create(experimenterId);


    await model.experimenterAssignment_2nd.destroy({
      where: { FK_Appointment: appointmentId },
    });

    if (experimenterIds_2nd.length > 0) {

      await model.experimenterAssignment_2nd.bulkCreate(
        experimenterIds_2nd
      );

    }


    if (calendarId) {

      // update calendar event
      const schedule = await model.schedule.findOne({
        where: { id: req.body.scheduleId },
        include: [
          {
            model: model.appointment,
            include: [
              { model: model.family },
              {
                model: model.child,
              },
              {
                model: model.study,
              },
              {
                model: model.personnel,
                as: "PrimaryExperimenter",
                through: { model: model.experimenterAssignment },
              },
              {
                model: model.personnel,
                as: "SecondaryExperimenter",
                through: { model: model.experimenterAssignment_2nd },
              },
            ],
          },
        ],
      });


      var attendees = [];
      var description = "<b>Note: </b>" + schedule.Note + "<br>";

      schedule.Appointments.forEach((appointment) => {
        appointment.PrimaryExperimenter.forEach((experimenter) => {
          attendees.push({
            displayName: experimenter.Name,
            email: experimenter.Calendar,
          });
        });

        appointment.SecondaryExperimenter.forEach((experimenter) => {
          attendees.push({
            displayName: experimenter.Name,
            email: experimenter.Calendar,
          });
        });

        appointment.E1 = appointment.PrimaryExperimenter[0].Name +
          " (" +
          appointment.PrimaryExperimenter[0].Email +
          ")"

        const experimenterNames_2nd = appointment.SecondaryExperimenter.map(
          (experimenter) => {
            return experimenter.Name + " (" + experimenter.Email + ")";
          }
        );

        appointment.E2 = experimenterNames_2nd.join(", "),

          description =
          description +
          "<br>==================" +
          "<br><b>" +
          appointment.Study.StudyName +
          "</b><br>" +
          "<b>E1: </b>" +
          appointment.E1 +
          "<br>" +
          "<b>E2: </b>" +
          appointment.E2 +
          "<br>";

        if (appointment.Study.StudyType == "Online") {
          description =
            description +
            "<b>zoom link: </b>" +
            appointment.PrimaryExperimenter[0].ZoomLink;
        }
      });

      const updatedScheduleInfo = {
        description: description,
        attendees: attendees,
      };


      const calendar = google.calendar({
        version: "v3",
        auth: req.oAuth2Client,
      });

      await calendar.events.patch({
        calendarId: "primary",
        eventId: calendarId,
        resource: updatedScheduleInfo,
      });

    }

    // // await model.schedule.update(
    // //   { Note: Schedule.Note + "" },
    // //   { where: { id: Schedule.id } }
    // // );

    // Schedule.dataValues.updatedAt = new Date();

    // Log
    const User = req.body.User;

    await log.createLog("Appointment Updated", User, "updated experimenters in study appointment");

    res.status(200).send('Experimenters updated!');

    console.log("Experimenters updated!");
  } catch (error) {
    console.log("Experimenters update error:" + error);
  }

});


// Delete an appointment with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
  try {
    var Schedule = await model.schedule.findOne({
      where: { id: req.query.FK_Schedule },
      include: [
        {
          model: model.appointment,
          include: [
            { model: model.family },
            {
              model: model.child,
            },
            {
              model: model.study,
            },
            {
              model: model.personnel,
              as: "PrimaryExperimenter",
              through: { model: model.experimenterAssignment },
            },
            {
              model: model.personnel,
              as: "SecondaryExperimenter",
              through: { model: model.experimenterAssignment_2nd },
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
      appointment.PrimaryExperimenter.forEach((experimenter) => {
        attendees.push({
          displayName: experimenter.Name,
          email: experimenter.Calendar,
        });
      });
      appointment.SecondaryExperimenter.forEach((experimenter) => {
        attendees.push({
          displayName: experimenter.Name,
          email: experimenter.Calendar,
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
        // sendNotifications: true
      });
    } catch (err) {
      throw err;
    }

    await model.appointment.destroy({
      where: { id: req.query.id },
    });

    // Update Schedule updatedAt
    await model.schedule.update(
      { Note: Schedule.Note + "" },
      { where: { id: req.query.FK_Schedule } }
    );

    Schedule.dataValues.updatedAt = new Date();

    // Log
    const User = JSON.parse(req.query.User);

    await log.createLog("Appointment Delete", User, "delelete a study appointment from a schedule (" + Schedule.id +
      ")");

    res.status(200).send(Schedule);
  } catch (error) {
    res.status(500).send(error);
  }
});
