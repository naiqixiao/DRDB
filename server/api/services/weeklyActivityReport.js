const path = require('path');
const moment = require('moment-timezone');
const model = require('../models/DRDB');
const { getMembers } = require('../controllers/activityReport');
const { loadLogs, analyze } = require('./activityLogReport');
const { makeCsv } = require('./activityReportCsv');

const ZONE = 'America/Toronto';
function previousWeek(now = moment()) {
  const end = now.clone().tz(ZONE).startOf('isoWeek');
  return { start: end.clone().subtract(1, 'week'), end };
}

async function generate(labId, start, end) {
  const lab = await model.lab.findByPk(labId);
  if (!lab || !lab.LabName || lab.LabName === '.' || lab.LabName === '..' || /[\\/\0]/.test(lab.LabName)) {
    throw new Error('Lab or log directory unavailable');
  }
  const members = await getMembers(labId, start, end);
  if (!members.length) throw new Error('No active personnel found');
  const directory = path.join(__dirname, '..', 'logs', lab.LabName);
  const rows = loadLogs(directory, start, end);
  const quality = analyze(rows, members, start, end);
  if (quality.invalid_schedule_time) throw new Error('A schedule activity has an ambiguous timestamp');
  const csv = makeCsv(members);
  return { lab, members, quality, csv, filename: `lab-activity-week-of-${start.format('YYYY-MM-DD')}.csv` };
}

module.exports = { previousWeek, generate };
