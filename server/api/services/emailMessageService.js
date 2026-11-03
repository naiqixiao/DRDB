const { normalizeAppointmentTime, formatDateInTimezone } = require('../utils/dateTime');

// Structured metadata feeds the same appointment card in previews and sent mail.
async function messageOptions(content, lab) {
  const options = { lab, subject: content.subject, htmlBody: content.body };
  if (!content.appointment) return options;
  const appointment = content.appointment;
  const textList = values => Array.isArray(values) ? values.filter(value => typeof value === 'string').map(value => value.slice(0, 200)).slice(0, 20).join(', ') : '';
  const { getEffectiveTimezone } = require('./timezoneService');
  const timeZone = await getEffectiveTimezone(lab.id);
  let time;
  try {
    if (typeof appointment.time !== 'string' || !appointment.time.trim()) throw new Error();
    time = normalizeAppointmentTime(appointment.time, timeZone);
  } catch {
    const error = new Error('A valid appointment date and time is required for the email preview.');
    error.status = 400;
    throw error;
  }
  options.details = [
    { label: 'When', value: formatDateInTimezone(time, 'dddd, MMMM D, YYYY [at] h:mm A z', timeZone) },
    { label: 'Study', value: textList(appointment.studies) || 'Your scheduled study' },
    { label: 'Where', value: appointment.online === true ? 'Online — joining details below' : lab.Location || 'See visit instructions below' },
  ];
  const children = textList(appointment.children);
  if (children) options.details.push({ label: 'Participating', value: children });
  return options;
}

module.exports = { messageOptions };
