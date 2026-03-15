const model = require("../models/DRDB");
const { Op } = require("sequelize");
const moment = require("moment");
const calendarService = require("./googleCalendarService");

/**
 * Standardized Include Block for Schedule Queries
 * Extracted from the old controller to ensure consistent data shaping.
 */
async function searchSchedules(queryString) {
  return await model.schedule.findAll({
    where: queryString,
    include: [
      {
        model: model.appointment,
        separate: false,
        include: [
          {
            model: model.child,
            attributes: ["id", "Name", "DoB", "Age", "Sex", "FK_Family", "IdWithinFamily"],
            include: [
              { model: model.appointment, separate: true, attributes: ["FK_Study"] },
              { model: model.family, attributes: ["AutismHistory"] },
            ],
          },
          {
            model: model.study,
            include: [
              { model: model.lab },
              { model: model.personnel, as: "Experimenters", through: { model: model.experimenter } },
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
      },
      {
        model: model.family,
        include: [
          {
            model: model.child,
            separate: true,
            include: [
              { model: model.appointment, separate: true, attributes: ["FK_Study"] },
              { model: model.family, attributes: ["AutismHistory"] },
            ],
          },
          { model: model.conversations },
        ],
      },
      {
        model: model.personnel,
      },
    ],
    order: [['id', 'DESC']],
  });
}

exports.searchSchedules = searchSchedules;

/**
 * Creates a new schedule, its appointments, assigns experimenters,
 * and syncs with Google Calendar.
 */
exports.createSchedule = async (newScheduleInfo, oAuth2Client, labId) => {
  newScheduleInfo.AppointmentTime = moment(newScheduleInfo.AppointmentTime).toISOString(true);

  // 1. Cleanup previously tentative appointments if they exist
  for (const app of newScheduleInfo.Appointments) {
    if (app.FK_Schedule) {
      await model.appointment.destroy({ where: { id: app.id } });
      await model.experimenterAssignment.destroy({ where: { FK_Appointment: app.id } });
      await model.experimenterAssignment_2nd.destroy({ where: { FK_Appointment: app.id } });
      delete app.FK_Schedule;
      delete app.id;
    }
  }

  // 2. Create the Schedule & Appointments in DB
  const schedule = await model.schedule.create(newScheduleInfo, {
    include: [model.appointment],
  });

  // 3. Assign Experimenters if Confirmed
  if (newScheduleInfo.Status === "Confirmed") {
    let experimenterList = [];
    let experimenter_2ndList = [];

    for (let i = 0; i < schedule.Appointments.length; i++) {
      let appointmentId = schedule.Appointments[i].id;
      
      (newScheduleInfo.Appointments[i].Experimenters || []).forEach(exp => {
        experimenterList.push({ FK_Experimenter: exp, FK_Appointment: appointmentId });
      });

      (newScheduleInfo.Appointments[i].Experimenters_2nd || []).forEach(exp => {
        experimenter_2ndList.push({ FK_Experimenter: exp, FK_Appointment: appointmentId });
      });
    }

    if (experimenterList.length > 0) await model.experimenterAssignment.bulkCreate(experimenterList);
    if (experimenter_2ndList.length > 0) await model.experimenterAssignment_2nd.bulkCreate(experimenter_2ndList);
  }

  // 4. Update Family's Assigned Lab
  if (newScheduleInfo.FK_Family) {
    await model.family.update({ AssignedLab: labId }, { where: { id: newScheduleInfo.FK_Family } });
  }

  // Return the created schedule with appointment IDs (frontend already has full data)
  return schedule.get({ plain: true });
};

/**
 * Updates a schedule, recreating appointments/assignments, and updating Family status.
 */
exports.updateSchedule = async (updatedScheduleInfo, oAuth2Client, labId) => {
  if (updatedScheduleInfo.AppointmentTime) {
    updatedScheduleInfo.AppointmentTime = moment(updatedScheduleInfo.AppointmentTime).toISOString(true);
  }

  switch (updatedScheduleInfo.Status) {
    case "Confirmed":
      updatedScheduleInfo.Completed = false;
      let experimenterList = [];
      let experimenter_2ndList = [];

      for (const appointment of updatedScheduleInfo.Appointments) {
        if (!appointment.id) {
          const newAppointment = await model.appointment.create(appointment);
          appointment.id = newAppointment.id;
        } else {
          await model.appointment.update(appointment, { where: { id: appointment.id } });
          await model.experimenterAssignment.destroy({ where: { FK_Appointment: appointment.id } });
          await model.experimenterAssignment_2nd.destroy({ where: { FK_Appointment: appointment.id } });
          updatedScheduleInfo.Reminded = 0;
        }

        (appointment.Experimenters || []).forEach(exp => experimenterList.push({ FK_Experimenter: exp, FK_Appointment: appointment.id }));
        (appointment.Experimenters_2nd || []).forEach(exp => experimenter_2ndList.push({ FK_Experimenter: exp, FK_Appointment: appointment.id }));
      }

      if (experimenterList.length > 0) await model.experimenterAssignment.bulkCreate(experimenterList);
      if (experimenter_2ndList.length > 0) await model.experimenterAssignment_2nd.bulkCreate(experimenter_2ndList);

      if (updatedScheduleInfo.FK_Family) {
        await model.family.update({ AssignedLab: labId }, { where: { id: updatedScheduleInfo.FK_Family } });
      }
      break;

    case "Cancelled":
    case "Rejected":
      updatedScheduleInfo.Completed = true;
      await model.family.update({ AssignedLab: null }, { where: { id: updatedScheduleInfo.FK_Family } });
      break;
  }

  await model.schedule.update(updatedScheduleInfo, { where: { id: updatedScheduleInfo.id } });

  return { id: updatedScheduleInfo.id, Status: updatedScheduleInfo.Status };
};

/**
 * Deletes a schedule and its associated calendar events safely.
 */
exports.deleteSchedule = async (scheduleId, oAuth2Client) => {
  const schedule = await model.schedule.findOne({ where: { id: scheduleId } });

  if (schedule && schedule.calendarEventId) {
    await calendarService.deleteEvent(oAuth2Client, "primary", schedule.calendarEventId);
  }

  await model.schedule.destroy({ where: { id: scheduleId } });
};
