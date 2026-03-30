const model = require("../models/DRDB");
const { Op } = require("sequelize");
const moment = require("moment");
const calendarService = require("./googleCalendarService");

/**
 * Standardized Include Block for Schedule Queries
 * Extracted from the old controller to ensure consistent data shaping.
 */
function normalizePagination(options = {}) {
  if (options.disablePagination) {
    return {};
  }

  const requestedLimit = Number.parseInt(options.limit, 10);
  const requestedOffset = Number.parseInt(options.offset, 10);

  const limit = Number.isInteger(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 200)
    : 100;
  const offset = Number.isInteger(requestedOffset) && requestedOffset >= 0
    ? requestedOffset
    : 0;

  return { limit, offset };
}

function buildScheduleSearchInclude() {
  return [
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
  ];
}

function buildScheduleCountInclude() {
  return [
    {
      model: model.appointment,
      attributes: [],
      required: false,
      include: [
        {
          model: model.study,
          attributes: [],
          required: false,
        },
      ],
    },
    {
      model: model.family,
      attributes: [],
      required: false,
    },
  ];
}

async function countSchedules(queryString) {
  return model.schedule.count({
    where: queryString,
    include: buildScheduleCountInclude(),
    distinct: true,
    col: "id",
    subQuery: false,
  });
}

async function searchSchedules(queryString, options = {}) {
  const pagination = normalizePagination(options);

  return await model.schedule.findAll({
    where: queryString,
    include: buildScheduleSearchInclude(),
    order: [['id', 'DESC']],
    ...pagination,
  });
}

exports.searchSchedules = searchSchedules;

async function searchSchedulesWithPagination(queryString, options = {}) {
  const schedules = await searchSchedules(queryString, options);

  if (options.disablePagination) {
    return { schedules, pagination: null };
  }

  const { limit, offset } = normalizePagination(options);
  const total = await countSchedules(queryString);

  return {
    schedules,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + schedules.length < total,
    },
  };
}

exports.searchSchedulesWithPagination = searchSchedulesWithPagination;

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

  // 1. ALWAYS Process Appointments (Regardless of Schedule Status)
  let experimenterList = [];
  let experimenter_2ndList = [];

  for (const appointment of updatedScheduleInfo.Appointments) {
    // Create new appointment if one was added during the update
    if (!appointment.id) {
      const newAppointment = await model.appointment.create({
        ...appointment,
        FK_Schedule: updatedScheduleInfo.id
      });
      appointment.id = newAppointment.id;
    } else {
      // Update existing appointment
      await model.appointment.update(appointment, { where: { id: appointment.id } });

      // Clear old experimenters so we can safely recreate them below if needed
      await model.experimenterAssignment.destroy({ where: { FK_Appointment: appointment.id } });
      await model.experimenterAssignment_2nd.destroy({ where: { FK_Appointment: appointment.id } });
      updatedScheduleInfo.Reminded = 0;
    }

    // Only queue up new experimenter assignments if the schedule is firmly Confirmed
    if (updatedScheduleInfo.Status === "Confirmed") {
      (appointment.Experimenters || []).forEach(exp => {
        experimenterList.push({ FK_Experimenter: exp, FK_Appointment: appointment.id });
      });
      (appointment.Experimenters_2nd || []).forEach(exp => {
        experimenter_2ndList.push({ FK_Experimenter: exp, FK_Appointment: appointment.id });
      });
    }
  }

  // 2. Re-assign experimenters
  if (experimenterList.length > 0) await model.experimenterAssignment.bulkCreate(experimenterList);
  if (experimenter_2ndList.length > 0) await model.experimenterAssignment_2nd.bulkCreate(experimenter_2ndList);

  // 3. Handle Status-Specific Logic (Family Lab Assignment & Completion)
  switch (updatedScheduleInfo.Status) {
    case "Confirmed":
    case "Rescheduling":
    case "TBD":
      updatedScheduleInfo.Completed = false;
      if (updatedScheduleInfo.FK_Family) {
        await model.family.update({ AssignedLab: labId }, { where: { id: updatedScheduleInfo.FK_Family } });
      }
      break;

    case "Cancelled":
    case "Rejected":
    case "No Show":
      updatedScheduleInfo.Completed = true;
      // Free up the family so they can be recruited by other labs
      await model.family.update({ AssignedLab: null }, { where: { id: updatedScheduleInfo.FK_Family } });
      break;
  }

  // 4. Update the Schedule Record itself
  await model.schedule.update(updatedScheduleInfo, { where: { id: updatedScheduleInfo.id } });

  // 5. Return the fully populated updated Schedule
  const updated = await searchSchedules({ id: updatedScheduleInfo.id });
  return updated[0];
};

/**
 * Deletes a schedule and its associated calendar events safely.
 */
exports.deleteSchedule = async (scheduleId, oAuth2Client) => {
  const schedule = await model.schedule.findOne({ where: { id: scheduleId } });

  // Safely delete the Google Calendar event if it exists
  if (schedule && schedule.calendarEventId && oAuth2Client) {
    try {
      await calendarService.deleteEvent(oAuth2Client, "primary", schedule.calendarEventId);
    } catch (error) {
      console.warn(`Could not delete calendar event ${schedule.calendarEventId}:`, error.message);
    }
  }

  // Delete the schedule from the database
  await model.schedule.destroy({ where: { id: scheduleId } });
};

