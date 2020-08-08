const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");

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

  if (req.query.Email) {
    queryString["$Appointments.Family.Email$"] = {
      [Op.like]: `${req.query.Email}%`,
    };
  }
  if (req.query.NameMom) {
    queryString["$Appointments.Family.NameMom$"] = {
      [Op.like]: `${req.query.NameMom}%`,
    };
  }
  if (req.query.NameDad) {
    queryString["$Appointments.Family.NameDad$"] = {
      [Op.like]: `${req.query.NameDad}%`,
    };
  }
  if (req.query.Phone) {
    queryString["$Appointments.Family.Phone$"] = {
      [Op.like]: `${req.query.Phone}%`,
    };
  }
  if (req.query.FamilyId) {
    queryString["$Appointments.FK_Family$"] = req.query.FamilyId;
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

  const schedule = await model.schedule.findAll({
    where: queryString,
    include: [
      {
        model: model.appointment,
        include: [
          {
            model: model.family,
          },
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
            attributes: ["id", "Name", "Email", "Calendar"],
          },
        ],
      },
    ],
  });
  res.status(200).send(schedule);
  console.log("Search successful!");
});

// Retrieve today's appointments from the database.
exports.today = asyncHandler(async (req, res) => {
  var queryString = {};

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
      ),
    ],
  };

  if (req.query.lab) {
    queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;
  }

  const schedule = await model.schedule.findAll({
    where: queryString,
    include: [
      {
        model: model.appointment,
        include: [
          {
            model: model.family,
          },
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
            attributes: ["id", "Name", "Email", "Calendar"],
          },
        ],
      },
    ],
  });
  res.status(200).send(schedule);
  console.log("Search successful!");
});

// Retrieve today's appointments from the database.
exports.week = asyncHandler(async (req, res) => {
  var queryString = {};

  queryString.AppointmentTime = {
    [Op.between]: [
      new Date(
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate()
        ).getTime() -
          24 * 60 * 60 * 1000 * new Date().getDay()
      ),
      new Date(
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getDate()
        ).getTime() +
          24 * 60 * 60 * 1000 * (7 - new Date().getDay())
      ),
    ],
  };

  if (req.query.lab) {
    queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;
  }

  const schedule = await model.schedule.findAll({
    where: queryString,
    include: [
      {
        model: model.appointment,
        include: [
          {
            model: model.family,
          },
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
            attributes: ["id", "Name", "Email", "Calendar"],
          },
        ],
      },
    ],
  });
  res.status(200).send(schedule);
  console.log("Search successful!");
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

    // case "No Show":
    // case "TBD":
    // case "Rescheduling":
    // case "Cancelled":
    // case "Rejected":
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
          model: model.appointment,
          include: [
            {
              model: model.family,
            },
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
              attributes: ["id", "Name", "Email", "Calendar"],
            },
          ],
        },
      ],
    });

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
      include: [
        {
          model: model.appointment,
          include: [
            {
              model: model.family,
            },
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
              attributes: ["id", "Name", "Email", "Calendar"],
            },
          ],
        },
      ],
    });

    res.status(200).send(updatedSchedule);

    console.log("Appointment Information Updated.");
  } catch (error) {
    console.log("Appointment update error: " + error);
    throw error;
  }
});

// Delete an appointment with the specified id in the request
exports.delete = asyncHandler(async (req, res) => {
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

  res.status(200).send("schedule deleted.");
});
