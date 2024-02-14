const model = require("../models/DRDB");
const { Op } = require("sequelize");
const asyncHandler = require("express-async-handler");
const { google } = require("googleapis");

google.options({
  params: {
      sendUpdates: 'all'
  }
});

const moment = require("moment");
// const fs = require("fs");
const log = require("../controllers/log");
const config = require("../../config/general");

// output

// {
//   "createdAt": {
//       "val": "CURRENT_TIMESTAMP"
//   },
//   "updatedAt": {
//       "val": "CURRENT_TIMESTAMP"
//   },
//   "Reminded": 0,
//   "ThankYouEmail": 0,
//   "Completed": 0,
//   "id": 5400,
//   "AppointmentTime": "2024-01-11T16:00:00.000Z",
//   "Status": "Confirmed",
//   "FK_Family": 204,
//   "Note": "",
//   "Appointments": [
//       {
//           "createdAt": {
//               "val": "CURRENT_TIMESTAMP"
//           },
//           "updatedAt": {
//               "val": "CURRENT_TIMESTAMP"
//           },
//           "id": 5215,
//           "FK_Family": 204,
//           "FK_Child": 407,
//           "FK_Study": 45,
//           "FK_Schedule": 5400
//       }
//   ],
//   "ScheduledBy": 58
// }

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
//       "timeZone": config.timeZone
//   },
//   "end": {
//       "dateTime": "2020-04-24T15:30:00.000",
//       "timeZone": config.timeZone
//   },
//   "attendees": [
//       {
//           "email": "g.jaeger0226@gmail.com"
//       }
//   ]
// }

exports.create = asyncHandler(async (req, res) => {
  var newScheduleInfo = req.body;

  newScheduleInfo.AppointmentTime = moment(
    newScheduleInfo.AppointmentTime
  ).toISOString(true);

  try {
    
    // check if there is any of the appointment has been scheduled before (with FK_Schedule and id).
    for (const app of newScheduleInfo.Appointments) {

      if (app.FK_Schedule) {
        //  1. remove the appointments based on the id
        await model.appointment.destroy({ where: { id: app.id } });

        // 2. remove the experimenter assignment associated with this appointment
        await model.experimenterAssignment.destroy({
          where: { FK_Appointment: app.id },
        });

        await model.experimenterAssignment_2nd.destroy({
          where: { FK_Appointment: app.id },
        });

        //  2. remove the FK_Schedule and id from each of the appointment
        delete app.FK_Schedule;
        delete app.id;
      }
    }

    // create new schedule, associated appointments, and experimenter assignment.
    const schedule = await model.schedule.create(newScheduleInfo, {
      include: [model.appointment],
    });

    if (newScheduleInfo.Status == "Confirmed") {
      // add primary experimenter
      var experimenterList = [];
      // add secondary experimenters
      var experimenter_2ndList = [];

      for (var i = 0; i < schedule.Appointments.length; i++) {
        var appointmentId = schedule.Appointments[i].id;

        newScheduleInfo.Appointments[i].Experimenters.forEach(
          (experimenter) => {
            experimenterList.push({
              FK_Experimenter: experimenter,
              FK_Appointment: appointmentId,
            });
          }
        );

        newScheduleInfo.Appointments[i].Experimenters_2nd.forEach(
          (experimenter_2nd) => {
            experimenter_2ndList.push({
              FK_Experimenter: experimenter_2nd,
              FK_Appointment: appointmentId,
            });
          }
        );
      }

      if (experimenterList.length > 0) {
        await model.experimenterAssignment.bulkCreate(experimenterList);
      }

      if (experimenter_2ndList.length > 0) {
        await model.experimenterAssignment_2nd.bulkCreate(experimenter_2ndList);
      }
    }

    if (newScheduleInfo.FK_Family) {
      // update family's AssignedLab with the current lab
      updateFamilyInfo = { AssignedLab: req.body.lab };

      await model.family.update(updateFamilyInfo, {
        where: { id: newScheduleInfo.FK_Family },
      });
    }

    // Log
    const User = req.body.User;

    await log.createLog(
      "Appointment Created",
      User,
      "added a study appointment to a schedule(" + schedule.id + ")"
    );

    const fullSchedule = await searchScheudles({id: schedule.id});

    res.status(200).send(fullSchedule[0]);
    console.log("schedule created!");
  } catch (error) {
    console.log( error);
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
    queryString.FK_Family = req.query.FamilyId;
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
    const schedule = await searchScheudles(queryString);
    res.status(200).send(schedule);
    console.log("Search successful!");
  } catch (error) {
    throw error;
  }
});

exports.searchFollowUps = asyncHandler(async (req, res) => {
  var queryString = {};

  queryString["$Family.NextContactDate$"] = {
    [Op.or]: [
      {
        [Op.lte]: moment()
          .startOf("day")
          .toDate(),
      },
      { [Op.eq]: null },
    ],
  };
  queryString["$Family.NoMoreContact$"] = 0;

  queryString.Status = { [Op.in]: ["TBD", "Rescheduling", "No Show"] };

  if (req.query.trainingMode === "true") {
    queryString["$Family.TrainingSet$"] = true;
  } else {
    queryString["$Family.TrainingSet$"] = false;
  }

  queryString["$Family.AssignedLab$"] = req.query.lab;

  if (req.query.lab) {
    queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;
  }

  try {
    const schedule = await searchScheudles(queryString);

    res.status(200).send(schedule);
    console.log("Follow up search successful!");
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
    const schedule = await searchScheudles(queryString);

    res.status(200).send(schedule);
    console.log("Search successful!");
  } catch (error) {
    throw error;
  }
});

exports.tomorrow = asyncHandler(async (req, res) => {
  var queryString = {};

  if (moment().day() >= 5) {
    // if today is Friday or weekend, return the schedule from today to the coming Monday.
    queryString.AppointmentTime = {
      [Op.between]: [
        moment()
          .add(1, "days")
          .startOf("day")
          .toDate(),
        moment()
          .add(1, "weeks")
          .weekday(2)
          .startOf("day")
          .toDate(),
      ],
    };
  } else {
    queryString.AppointmentTime = {
      [Op.between]: [
        moment()
          .add(1, "days")
          .startOf("day")
          .toDate(),
        moment()
          .add(2, "days")
          .startOf("day")
          .toDate(),
      ],
    };
  }

  if (req.query.trainingMode === "true") {
    queryString["$Family.TrainingSet$"] = true;
  } else {
    queryString["$Family.TrainingSet$"] = false;
  }

  if (req.query.lab) {
    queryString["$Appointments.Study.FK_Lab$"] = req.query.lab;
  }

  try {
    const schedule = await searchScheudles(queryString);

    res.status(200).send(schedule);
    console.log("Search successful!");
  } catch (error) {
    throw error;
  }
});

// Retrieve this week's appointments from the database.
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
    const schedule = await searchScheudles(queryString);

    res.status(200).send(schedule);
    console.log("Search successful!");
  } catch (error) {
    throw error;
  }
});

// ////////////////////////////////////////////
// update an schedule.
exports.update = asyncHandler(async (req, res) => {
  var updatedScheduleInfo = req.body;

  if (updatedScheduleInfo.AppointmentTime) {
    updatedScheduleInfo.AppointmentTime = moment(
      updatedScheduleInfo.AppointmentTime
    ).toISOString(true);
  }

  // if (updatedScheduleInfo.id) {
  //   const ID = updatedScheduleInfo.id;
  //   delete updatedScheduleInfo["id"];
  // }

  switch (updatedScheduleInfo.Status) {
    case "Confirmed":
      // add primary experimenter
      var experimenterList = [];
      // add secondary experimenters
      var experimenter_2ndList = [];

      updatedScheduleInfo.Completed = false;

      // check each appointment, and update the experimenter assignment
      for (const appointment of updatedScheduleInfo.Appointments) {
        if (!appointment.id) {
          // create new appointment and experimenter assignment, it happens when a new appointment is added to the schedule.
          // new appointment added to the schedule

          const newAppointment = await model.appointment.create(appointment);

          appointment.id = newAppointment.id;
        } else {
          // Because the assigned study might be changed or the appointment now includes calendar events, we need to update it.
          await model.appointment.update(appointment, {
            where: { id: appointment.id },
          });

          // remove exist experimenter assignment
          await model.experimenterAssignment.destroy({
            where: { FK_Appointment: appointment.id },
          });

          await model.experimenterAssignment_2nd.destroy({
            where: { FK_Appointment: appointment.id },
          });

          // reset reminder setting
          updatedScheduleInfo.Reminded = 0;
        }

        // new experimenter assigment
        appointment.Experimenters.forEach((experimenter) => {
          experimenterList.push({
            FK_Experimenter: experimenter,
            FK_Appointment: appointment.id,
          });
        });

        appointment.Experimenters_2nd.forEach((experimenter) => {
          experimenter_2ndList.push({
            FK_Experimenter: experimenter,
            FK_Appointment: appointment.id,
          });
        });

        if (experimenterList.length > 0) {
          await model.experimenterAssignment.bulkCreate(experimenterList);
        }

        if (experimenter_2ndList.length > 0) {
          await model.experimenterAssignment_2nd.bulkCreate(
            experimenter_2ndList
          );
        }
      }

      if (updatedScheduleInfo.FK_Family) {
        // update family's AssignedLab with the current lab
        updateFamilyInfo = { AssignedLab: req.body.lab };

        await model.family.update(updateFamilyInfo, {
          where: { id: updatedScheduleInfo.FK_Family },
        });
      }

      break;

    case "Cancelled":
    case "Rejected":
      updatedScheduleInfo.Completed = true;

      // update family by removing AssignedLab from the family
      updateFamilyInfo = { AssignedLab: null };

      await model.family.update(updateFamilyInfo, {
        where: { id: updatedScheduleInfo.FK_Family },
      });
      break;
  }

  try {
    const updatedSchedule = await model.schedule.update(updatedScheduleInfo, {
      where: { id: updatedScheduleInfo.id },
    });

    // Log
    const User = req.body.User;

    await log.createLog(
      "Appointment Update",
      User,
      "updated a study appointment (" + updatedScheduleInfo.id + ")"
    );

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
    const updatedSchedule = await model.schedule.update(
      { Reminded: 1 },
      {
        where: { id: ID },
      }
    );

    // Log
    const User = req.body.User;

    await log.createLog(
      "Appointment Remind",
      User,
      "sent a reminding email for a study appointment (" + ID + ")"
    );

    res.status(200).send(updatedSchedule);

    console.log("Appointment Reminder Updated.");
  } catch (error) {
    console.log("Appointment update error: " + error);
    throw error;
  }
});

exports.tyEmail = asyncHandler(async (req, res) => {
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

    await log.createLog(
      "Appointment update",
      User,
      "sent a thank you email for study schedule (" + ID + ")"
    );

    res.status(200).send(updatedSchedule);

    console.log("Thank you email sent.");
  } catch (error) {
    console.log("Thank you email error: " + error);
    throw error;
  }
});

exports.complete = asyncHandler(async (req, res) => {
  var updatedScheduleInfo = req.body;
  
  if (updatedScheduleInfo.id) {
    ID = updatedScheduleInfo.id;
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

    await log.createLog(
      "Appointment Complete",
      User,
      "marked the study appointment (" + ID + ") as completed"
    );

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
        sendNotifications: true,
      });
    }

    await model.schedule.destroy({
      where: { id: req.query.id },
    });

    // Log
    const User = JSON.parse(req.query.User);

    await log.createLog(
      "Appointment Delete",
      User,
      "deleted a study appointment (" + req.query.id + ")"
    );

    res.status(200).send("schedule deleted.");
  } catch (error) {
    throw error;
  }
});

exports.special = asyncHandler(async (req, res) => {
  var queryString = {};
  queryString["$Appointments.Study.FK_Lab$"] = 2;

  try {
    var schedules = await searchScheudles(queryString);

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

async function searchScheudles(queryString) {
  const schedule = await model.schedule.findAll({
    where: queryString,
    include: [
      {
        model: model.appointment,
        include: [
          {
            model: model.child,
            attributes: [
              "id",
              "Name",
              "DoB",
              "Age",
              "Sex",
              "FK_Family",
              "IdWithinFamily",
            ],
            include: [
              {
                model: model.appointment,
                attributes: ["FK_Study"],
              },
              {
                model: model.family,
                attributes: ["AutismHistory"],
              },
            ],
          },
          {
            model: model.study,
            include: [
              { model: model.lab },
              {
                model: model.personnel,
                as: "Experimenters",
                through: {
                  model: model.experimenter,
                },
              },
            ],
          },
          {
            model: model.personnel,
            as: "PrimaryExperimenter",
            through: { model: model.experimenterAssignment },
            attributes: [
              "id",
              "Name",
              "Email",
              "Calendar",
              "ZoomLink",
              "Initial",
            ],
          },
          {
            model: model.personnel,
            as: "SecondaryExperimenter",
            through: { model: model.experimenterAssignment_2nd },
            attributes: [
              "id",
              "Name",
              "Email",
              "Calendar",
              "ZoomLink",
              "Initial",
            ],
          },
        ],
      },
      {
        model: model.family,
        include: [
          {
            model: model.child,
            include: [
              {
                model: model.appointment,
                attributes: ["FK_Study"],
              },
              {
                model: model.family,
                attributes: ["AutismHistory"],
              },
            ],
          },
          { model: model.conversations },
        ],
      },
      {
        model: model.personnel,
      },
    ],
    order: [["AppointmentTime", "ASC"]],
  });

  return schedule;
}
