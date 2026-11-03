const moment = require('moment-timezone');
const { MOCK, mockScheduleForFamily, mockScheduleList, mockExperimenter } = require('../utils/reminderPreviewFixtures');
const templates = require('../utils/reminderTemplates');

const REMINDER_SAMPLES = [
  { id: 'family-inperson', label: 'Parent reminder · in person' },
  { id: 'family-online', label: 'Parent reminder · online' },
  { id: 'family-siblings', label: 'Parent reminder · two children' },
  { id: 'manual', label: 'Staff · family without email' },
  { id: 'completion', label: 'Staff · confirm study completion' },
  { id: 'rejection', label: 'Staff · unresolved appointments' },
  { id: 'experimenter', label: 'Staff · tomorrow’s studies' },
];

// No participant queries or persisted schedules: all records below are fictional.
// Lab settings and an optionally selected study supply the real message content.
function buildReminderSample({ type, lab, study, timeZone }) {
  if (!REMINDER_SAMPLES.some(sample => sample.id === type)) throw new Error('Unknown reminder sample.');
  const tomorrow = moment.tz(timeZone).add(1, 'day').hour(10).minute(30).second(0).millisecond(0).toDate();
  if (type.startsWith('family-') || type === 'manual') {
    const schedule = mockScheduleForFamily({ hasEmail: type !== 'manual', studyType: type === 'family-online' ? 'Online' : 'In-person' });
    schedule.AppointmentTime = tomorrow;
    const appointment = schedule.Appointments[0];
    appointment.Study = {
      ...appointment.Study,
      StudyName: study?.StudyName || MOCK.studyName,
      ReminderTemplate: study?.ReminderTemplate || MOCK.reminderTemplate,
      Lab: { id: lab.id, LabName: lab.LabName, Email: lab.Email, Location: lab.Location,
        ZoomLink: lab.ZoomLink, EmailClosing: lab.EmailClosing || "", TransportationInstructions: lab.TransportationInstructions || "" },
    };
    // A fake joining URL demonstrates placeholder substitution without using a staff account.
    appointment.PrimaryExperimenter[0].ZoomLink = 'https://example.org/sample-study-link';
    if (type === 'family-siblings') {
      schedule.Appointments.push({ ...appointment, Child: { ...appointment.Child, Name: 'Emma Johnson' } });
    }
    const message = type === 'manual'
      ? templates.buildManualReminderBody(schedule, timeZone)
      : templates.buildFamilyReminderBody(schedule, timeZone);
    return { htmlBody: message.body, subject: message.subject, lab,
      layout: type === 'manual' ? { category: 'Staff reminder', reason: 'Please contact this family by phone to remind them about their appointment.' } : {} };
  }
  const layout = { wide: true, category: 'Staff reminder' };
  if (type === 'experimenter') {
    const experimenter = mockExperimenter();
    experimenter.Lab = lab;
    experimenter.PrimaryExperimenterof[0].Schedule.AppointmentTime = tomorrow;
    experimenter.PrimaryExperimenterof[0].Study.StudyName = study?.StudyName || MOCK.studyName;
    experimenter.SecondaryExperimenterof[0].Schedule.AppointmentTime = moment(tomorrow).add(3, 'hours').toDate();
    return { htmlBody: templates.buildExperimenterReminderBody(experimenter, timeZone), subject: 'Reminder for upcoming studies', lab, layout };
  }
  const list = mockScheduleList().map((row, index) => ({ ...row, LabName: lab.LabName, LabEmail: lab.Email, LabID: lab.id,
    StudyName: index === 0 && study ? study.StudyName : row.StudyName,
    AppointmentTime: moment(tomorrow).subtract(2, 'days').add(index * 3, 'hours').toDate(),
  }));
  return {
    htmlBody: type === 'completion'
      ? templates.buildCompletionReminderBody(MOCK.experimenterName, list, timeZone)
      : templates.buildRejectionReminderBody(MOCK.experimenterName, list, timeZone),
    subject: type === 'completion' ? 'Study confirmation reminder' : 'Study follow-up reminder',
    lab, layout,
  };
}

module.exports = { REMINDER_SAMPLES, buildReminderSample };
