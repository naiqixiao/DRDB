const moment = require('moment-timezone');
const asyncHandler = require('express-async-handler');
const { QueryTypes } = require('sequelize');
const model = require('../models/DRDB');

// This endpoint intentionally returns only the database-derived part of the report.
exports.weekly = asyncHandler(async (req, res) => {
  const requester = await model.personnel.findByPk(req.userData.id);
  if (!requester || requester.Retired || !requester.Active ||
      !['Admin', 'PI', 'Lab manager'].includes(requester.Role) || !requester.FK_Lab) {
    return res.status(403).json({ message: 'An active lab administrator, PI, or lab manager is required.' });
  }

  const zone = 'America/Toronto';
  const start = moment.tz(req.query.week_start, 'YYYY-MM-DD', true, zone);
  if (typeof req.query.week_start !== 'string' || !start.isValid() || start.isoWeekday() !== 1) {
    return res.status(400).json({ message: 'week_start must be a Monday in YYYY-MM-DD format.' });
  }
  const end = start.clone().add(1, 'week');
  if (end.isAfter(moment.tz(zone))) {
    return res.status(400).json({ message: 'The reporting week must be complete.' });
  }

  if (req.query.include_logs === 'true') {
    const { generate } = require('../services/weeklyActivityReport');
    const report = await generate(requester.FK_Lab, start, end);
    res.set('Cache-Control', 'no-store');
    return res.json({ period: { start: start.format('YYYY-MM-DD'), end_exclusive: end.format('YYYY-MM-DD'), timezone: zone }, members: report.members, data_quality: report.quality, filename: report.filename });
  }

  const members = await getMembers(requester.FK_Lab, start, end);
  res.set('Cache-Control', 'no-store');
  return res.json({
    period: { start: start.format('YYYY-MM-DD'), end_exclusive: end.format('YYYY-MM-DD'), timezone: zone },
    definitions: 'Distinct confirmed appointments by scheduled time and current E1/E2 assignment. Completion is not verified. One appointment can count in both categories.',
    limitations: 'Database-derived role counts only. Schedule creations, updates and estimated DRDB time require separate log analysis. Current active personnel and current assignments are used.',
    members,
  });
});

async function getMembers(labId, start, end) {
  // Compare Toronto wall-time boundaries; production timestamp storage must be
  // checked during deployment. Independent subqueries avoid multiplying counts.
  const members = await model.sequelize.query(`
    SELECT p.Name AS full_name, p.Email AS email,
      (SELECT COUNT(DISTINCT a.id) FROM Appointment a
       JOIN Schedule s ON s.id = a.FK_Schedule
       JOIN Study st ON st.id = a.FK_Study
       JOIN ExperimenterAssignment e ON e.FK_Appointment = a.id
       WHERE e.FK_Experimenter = p.id AND st.FK_Lab = :labId
         AND s.Status = 'Confirmed' AND s.AppointmentTime >= :start AND s.AppointmentTime < :end) AS sessions_e1,
      (SELECT COUNT(DISTINCT a.id) FROM Appointment a
       JOIN Schedule s ON s.id = a.FK_Schedule
       JOIN Study st ON st.id = a.FK_Study
       JOIN SecondExperimenterAssignment e ON e.FK_Appointment = a.id
       WHERE e.FK_Experimenter = p.id AND st.FK_Lab = :labId
         AND s.Status = 'Confirmed' AND s.AppointmentTime >= :start AND s.AppointmentTime < :end) AS sessions_e2
    FROM Personnel p
    WHERE p.FK_Lab = :labId AND p.Active = 1 AND p.Retired = 0
    ORDER BY p.Name, p.id`, {
    replacements: { labId, start: start.format('YYYY-MM-DD HH:mm:ss'), end: end.format('YYYY-MM-DD HH:mm:ss') },
    type: QueryTypes.SELECT,
  });
  return members.map(row => ({ full_name: row.full_name, email: row.email || '', sessions_e1: Number(row.sessions_e1), sessions_e2: Number(row.sessions_e2) }));
}

exports.getMembers = getMembers;
