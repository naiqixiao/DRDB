const { REMINDER_SAMPLES, buildReminderSample } = require('../api/services/reminderPreviewService');
const lab = { id: 7, LabName: 'Learning Lab', Email: 'lab@example.org', Location: 'Room 42', EmailClosing: '<p>Contact the lab to reschedule.</p>', TransportationInstructions: '<p>Saved parking instructions.</p>' };
const study = { StudyName: 'Saved Study', ReminderTemplate: '<p>${{childName}} will play a game.</p><p>${{ZoomLink}}</p>' };

beforeAll(() => jest.useFakeTimers().setSystemTime(new Date('2026-11-02T18:00:00Z')));
afterAll(() => jest.useRealTimers());

test.each(REMINDER_SAMPLES)('$label renders a complete reminder through the production builder', ({id}) => {
  const result = buildReminderSample({ type: id, lab, timeZone: 'America/Toronto' });
  expect(result.lab).toBe(lab);
  expect(result.htmlBody).toContain('Learning Lab');
  expect(result.subject).toBeTruthy();
  expect(result.htmlBody).not.toContain('undefined');
  expect(result).not.toHaveProperty('to');
});

test('linked sibling sample uses the saved study snippet, real lab instructions, and effective timezone', () => {
  const result = buildReminderSample({ type: 'family-siblings', lab, study, timeZone: 'America/Vancouver' });
  for (const text of ['Liam and Emma will play a game.', 'Saved Study', '10:30 AM PST', 'Room 42', 'Saved parking instructions.', 'Contact the lab to reschedule.']) expect(result.htmlBody).toContain(text);
  expect(result.htmlBody).not.toContain('${{');
});

test('online sample substitutes a fictional joining link', () => {
  const result = buildReminderSample({ type: 'family-online', lab, study, timeZone: 'America/Toronto' });
  expect(result.htmlBody).toContain('https://example.org/sample-study-link');
  expect(result.htmlBody).toContain('Online — joining details below');
});
