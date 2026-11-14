const crypto = require('crypto');
const { google } = require('googleapis');
const model = require('../models/DRDB');
const { getLabOAuth2Client } = require('../utils/emailUtil');
const { previousWeek, generate } = require('./weeklyActivityReport');
const { Op } = require('sequelize');

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const b64 = value => Buffer.from(value, 'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n') || '';

function compose({ to, from, subject, text, html, attachment }) {
  for (const value of [to, from, subject]) if (/[\r\n]/.test(value)) throw new Error('Invalid email header');
  const outer = `activity-${crypto.randomBytes(12).toString('hex')}`;
  const alt = `alternative-${crypto.randomBytes(12).toString('hex')}`;
  const parts = [
    `To: ${to}\r\nFrom: ${from}\r\nSubject: ${subject}\r\nMIME-Version: 1.0\r\n`,
    `Content-Type: multipart/mixed; boundary="${outer}"\r\n\r\n`,
    `--${outer}\r\nContent-Type: multipart/alternative; boundary="${alt}"\r\n\r\n`,
    `--${alt}\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64(text)}\r\n`,
    `--${alt}\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64(html)}\r\n`,
    `--${alt}--\r\n`,
  ];
  if (attachment) parts.push(`--${outer}\r\nContent-Type: text/csv; charset=UTF-8; name="${attachment.filename}"\r\nContent-Disposition: attachment; filename="${attachment.filename}"\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64(attachment.csv)}\r\n`);
  parts.push(`--${outer}--\r\n`);
  return Buffer.from(parts.join('')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function formatReport(report, start, end) {
  const period = `${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')} (end exclusive, America/Toronto)`;
  const note = `Schedule creations and updates count distinct schedule IDs recorded by each user, including creations later deleted. E1/E2 count distinct confirmed appointments by scheduled time and current assignment; completion is not verified. A record may count in multiple categories. Current active members are shown. Unattributed schedule events: ${report.quality.unattributed_schedule_events}. Excluded sessions: ${report.quality.excluded_sessions}. Estimated DRDB hours are elapsed time between recorded login and the last recorded manual family, child, appointment, study, experimenter-assignment or conversation task before the next login. Automated events are excluded. Estimates may include idle time and omit work outside DRDB. They are not verified active time or a substitute for reported hours. Activity counts do not measure hours and must not be used to automatically judge attendance or performance. ${report.quality.estimate_available ? '' : 'The elapsed-time estimate is unavailable because log analysis failed or timestamps were ambiguous or invalid.'}`;
  const headings = ['Name', 'Email', 'Schedules created', 'Schedules updated', 'E1', 'E2', 'Estimated DRDB hours'];
  const rows = report.members.map(m => [m.full_name, m.email, m.schedules_created, m.schedules_updated, m.sessions_e1, m.sessions_e2, m.estimated_drdb_hours == null ? 'Unavailable' : m.estimated_drdb_hours]);
  const text = [`Lab activity report: ${period}`, '', headings.join(' | '), ...rows.map(r => r.join(' | ')), '', note, '', `CSV attachment: ${report.filename}`].join('\n');
  const html = `<h1>Lab activity report</h1><p>${escapeHtml(period)}</p><table><thead><tr>${headings.map(x => `<th>${escapeHtml(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${escapeHtml(x)}</td>`).join('')}</tr>`).join('')}</tbody></table><p>${escapeHtml(note)}</p><p>CSV attachment: ${escapeHtml(report.filename)}</p>`;
  return { period, text, html };
}

async function sendRaw(labId, message) {
  const gmail = google.gmail({ version: 'v1', auth: getLabOAuth2Client(labId) });
  return gmail.users.messages.send({ userId: 'me', requestBody: { raw: compose(message) } });
}

async function sendWeekly(labId, now) {
  const { start, end } = previousWeek(now);
  const lab = await model.lab.findByPk(labId);
  if (!lab || !lab.Email) throw new Error('Lab email is unavailable');
  const recipientSetting = await model.systemSetting.findOne({ where: { SettingKey: `WeeklyActivityReportConfig_${labId}` } });
  const config = recipientSetting ? JSON.parse(recipientSetting.SettingValue) : {};
  const to = config.recipient || lab.Email;
  const from = lab.Email;
  const key = `WeeklyActivitySent_${labId}_${start.format('YYYY-MM-DD')}`;
  // A unique key acts as a durable claim. An uncertain send is held for manual
  // reconciliation, rather than risking a duplicate message on a retry.
  try { await model.systemSetting.create({ SettingKey: key, SettingValue: 'claimed' }); }
  catch (error) { if (error.name === 'SequelizeUniqueConstraintError') return { skipped: true }; throw error; }
  let report;
  try { report = await generate(labId, start, end); }
  catch (error) {
    const subject = `Lab activity report failed: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`;
    const text = `The lab activity report for ${start.format('YYYY-MM-DD')} through ${end.format('YYYY-MM-DD')} (exclusive), America/Toronto, could not be generated. No report is attached. Please investigate the server logs.`;
    const result = await sendRaw(labId, { to, from, subject, text, html: `<p>${escapeHtml(text)}</p>` });
    await model.systemSetting.update({ SettingValue: `failure-notified:${result.data.id}` }, { where: { SettingKey: key } });
    return { failureNotified: true };
  }
  const formatted = formatReport(report, start, end);
  const result = await sendRaw(labId, { to, from, subject: `Lab activity report: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}`, text: formatted.text, html: formatted.html, attachment: report });
  await model.systemSetting.update({ SettingValue: `sent:${result.data.id}` }, { where: { SettingKey: key } });
  return { sent: true };
}

async function runEnabled() {
  const settings = await model.systemSetting.findAll({ where: { SettingKey: { [Op.like]: 'WeeklyActivityReportConfig_%' } } });
  for (const setting of settings) {
    const match = /^WeeklyActivityReportConfig_(\d+)$/.exec(setting.SettingKey);
    if (!match) continue;
    try {
      const config = JSON.parse(setting.SettingValue);
      if (config.enabled === true) await sendWeekly(Number(match[1]));
    } catch (error) {
      console.error('[Weekly activity report] Delivery failed for lab', match[1], error.message);
    }
  }
}

module.exports = { compose, formatReport, sendWeekly, runEnabled };
