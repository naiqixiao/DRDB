const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

const ZONE = 'America/Toronto';

// jsonexport produces standard quoted CSV, including embedded newlines.
function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (quoted) throw new Error('Incomplete CSV record');
  if (row.length || cell) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  if (!rows.length) throw new Error('Empty log');
  const header = rows.shift().map(x => x.replace(/^\uFEFF/, ''));
  for (const key of ['Type', 'User', 'Email', 'Lab', 'Log', 'Date', 'Time']) {
    if (!header.includes(key)) throw new Error('Invalid log header');
  }
  return rows.filter(r => r.some(Boolean)).map(r => {
    if (r.length !== header.length) throw new Error('Invalid CSV record');
    return Object.fromEntries(header.map((key, i) => [key, r[i]]));
  });
}

function timestamp(row) {
  const raw = `${row.Date} ${row.Time}`;
  const m = moment.tz(raw, ['MM/DD/YYYY H:m', 'M/D/YYYY H:m'], true, ZONE);
  if (!m.isValid()) return null;
  // Reject repeated wall-clock minutes during the autumn DST transition.
  const format = 'MM/DD/YYYY HH:mm';
  if (m.clone().add(1, 'hour').format(format) === m.format(format) ||
      m.clone().subtract(1, 'hour').format(format) === m.format(format)) return null;
  return m.valueOf();
}

function loadLogs(directory, start, end) {
  const files = fs.readdirSync(directory).filter(f => /^Log_\d{4}_\d{2}_\d{2}\.csv$/.test(f)).sort();
  // The logger uses Sunday-based files. Missing expected files cannot be assumed empty.
  let sunday = start.clone().startOf('week');
  const required = new Set();
  while (sunday.isBefore(end)) {
    const name = sunday.format('[Log_]YYYY_MM_DD[.csv]');
    if (!files.includes(name)) throw new Error('Required weekly log file unavailable');
    required.add(name);
    sunday.add(1, 'week');
  }
  const rows = [];
  rows.incompleteHistory = false;
  const orderedFiles = [...required, ...files.filter(file => !required.has(file))];
  for (const file of orderedFiles) {
    try { for (const row of parseCsv(fs.readFileSync(path.join(directory, file), 'utf8'))) rows.push(row); }
    catch (error) {
      if (required.has(file)) throw error;
      rows.incompleteHistory = true;
      break;
    }
  }
  return rows;
}

function analyze(rows, members, start, end) {
  const byEmail = new Map();
  for (const member of members) {
    const email = (member.email || '').trim().toLowerCase();
    if (email) {
      if (byEmail.has(email)) throw new Error('Duplicate personnel email');
      byEmail.set(email, member);
    }
    member.schedules_created = 0; member.schedules_updated = 0; member.estimated_drdb_hours = 0;
  }
  const startMs = start.valueOf(), endMs = end.valueOf();
  const created = new Set(), updated = new Set(), events = new Map();
  let excluded = 0, unattributed = 0, uncertainTime = Boolean(rows.incompleteHistory), invalidScheduleTime = false;
  for (const row of rows) {
    const email = (row.Email || '').trim().toLowerCase();
    const member = byEmail.get(email);
    const time = timestamp(row);
    const isLogin = row.Type === 'Log in';
    const isAction = /^(Family|Child|Appointment|Study|Experimenter Assignment|Conversation) (Created|Updated|Delete|Deleted|Complete|Removed|Merged|Added|Remind|update)$/.test(row.Type);
    if ((isLogin || isAction) && !time) {
      const date = moment(row.Date, ['MM/DD/YYYY', 'M/D/YYYY'], true);
      // An unreadable date cannot be placed outside the reporting week safely.
      const nearWeek = !date.isValid() || (date.format('YYYY-MM-DD') >= start.clone().subtract(1, 'day').format('YYYY-MM-DD') && date.format('YYYY-MM-DD') <= end.format('YYYY-MM-DD'));
      if (nearWeek) {
        uncertainTime = true;
        if (isLogin) excluded++;
        if (['Appointment Created', 'Appointment Updated'].includes(row.Type)) invalidScheduleTime = true;
      }
      continue;
    }
    if (time >= startMs && time < endMs && ['Appointment Created', 'Appointment Updated'].includes(row.Type)) {
      const match = row.Log.match(/\((\d+)\)/);
      if (!match || !member) { unattributed++; continue; }
      const unique = `${email}:${match[1]}`;
      const set = row.Type === 'Appointment Created' ? created : updated;
      if (!set.has(unique)) { set.add(unique); member[row.Type === 'Appointment Created' ? 'schedules_created' : 'schedules_updated']++; }
    }
    if (!isLogin && !isAction) continue;
    if (!member) { if (isLogin && time >= startMs && time < endMs) excluded++; continue; }
    if (!events.has(email)) events.set(email, []);
    events.get(email).push({ time, isLogin });
  }
  try { for (const [email, list] of events) {
    list.sort((a, b) => a.time - b.time);
    let login = null, last = null, ambiguous = false;
    const close = next => {
      if (login === null) return;
      if (login < endMs && next > startMs && (last === null || last > startMs)) {
        if (last === null || ambiguous || last <= login) excluded++;
        else byEmail.get(email).estimated_drdb_hours += Math.max(0, Math.min(last, endMs) - Math.max(login, startMs)) / 3600000;
      }
    };
    for (const event of list) {
      if (event.isLogin) {
        if (login !== null && event.time === login) ambiguous = true;
        close(event.time); login = event.time; last = null; ambiguous = false;
      } else if (login !== null) {
        if (event.time === login || event.time === last) ambiguous = true;
        last = event.time;
      }
    }
    close(Infinity);
  } } catch (error) { uncertainTime = true; }
  for (const member of members) member.estimated_drdb_hours = uncertainTime ? null : Number(member.estimated_drdb_hours.toFixed(2));
  return { excluded_sessions: rows.incompleteHistory ? null : excluded, unattributed_schedule_events: unattributed, estimate_available: !uncertainTime, invalid_schedule_time: invalidScheduleTime };
}

module.exports = { parseCsv, timestamp, loadLogs, analyze };
