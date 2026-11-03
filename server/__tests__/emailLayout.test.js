jest.mock('googleapis', () => ({ google: { auth: { OAuth2: jest.fn() }, gmail: jest.fn() } }));
const { renderEmail, plainText } = require('../api/utils/emailLayout');
const { encodeMessage, sendLabEmail } = require('../api/utils/emailUtil');
const { google } = require('googleapis');
const lab = { LabName: 'Learning & Development', Email: 'lab@example.org', Location: 'Room <123>' };

test('brands fragments, escapes metadata, preserves rich text, and prevents duplicate wrapping', () => {
  const html = renderEmail({ lab, subject: 'A <visit>', htmlBody: '<p>Hi Alex</p><a href="https://example.org/join">Join</a>' });
  for (const text of ['Learning &amp; Development', 'Room &lt;123&gt;', 'A &lt;visit&gt;', 'mailto:lab@example.org', 'href="https://example.org/join"']) expect(html).toContain(text);
  expect(html).not.toContain('Jordan Lee');
  expect(html).not.toContain('Dear Alex');
  expect(renderEmail({ htmlBody: html })).toBe(html);
});

test('extracts legacy document bodies and defaults missing lab details', () => {
  const html = renderEmail({ htmlBody: '<!doctype html><html><head><title>Old</title></head><body><table><tr><td>Study A</td></tr></table></body></html>', wide: true });
  expect(html.match(/<!doctype html>/gi)).toHaveLength(1);
  expect(html.match(/<html\b/gi)).toHaveLength(1);
  expect(html).toContain('Developmental Research Management System');
  expect(html).toContain('max-width:800px');
  expect(html).toContain('<td>Study A</td>');
  expect(html).not.toContain('undefined');
  expect(html).not.toContain('mailto:');
});

test('escapes appointment details and omits invalid contact URLs', () => {
  const html = renderEmail({ lab: { ...lab, Email: 'bad" onclick="alert(1)' }, details: [{ label: 'When', value: '<script>bad</script>' }] });
  expect(html).toContain('&lt;script&gt;bad&lt;/script&gt;');
  expect(html).not.toContain('mailto:');
});

test('encodes Unicode in text and HTML alternatives while retaining routing', () => {
  const body = renderEmail({ lab, htmlBody: '<p>Hi Zoë — thanks!</p><a href="https://example.org">Visit</a>' });
  const raw = Buffer.from(encodeMessage({ to: 'zoe@example.org', from: lab.Email, cc: 'cc@example.org', bcc: 'bcc@example.org', subject: 'Zoë — visit', body }), 'base64url').toString();
  for (const text of ['To: zoe@example.org\r\n', 'Cc: cc@example.org\r\n', 'Bcc: bcc@example.org\r\n', 'multipart/alternative']) expect(raw).toContain(text);
  const boundary = raw.match(/boundary="([^"]+)"/)[1];
  const parts = raw.split('--' + boundary).slice(1, 3);
  expect(parts).toHaveLength(2);
  const decode = part => Buffer.from(part.split('\r\n\r\n')[1].trim(), 'base64').toString();
  expect(parts[0]).toContain('text/plain');
  expect(decode(parts[0])).toContain('Hi Zoë — thanks!');
  expect(decode(parts[1])).toBe(body);
  expect(plainText(body)).toContain('Visit (https://example.org)');
});

test('transport retains Gmail label behavior with the shared layout', async () => {
  const gmail = { users: {
    labels: { list: jest.fn().mockResolvedValue({ data: { labels: [{ name: 'Reminder-email', id: 'label1' }] } }) },
    messages: { send: jest.fn().mockResolvedValue({ data: { id: 'sent1' } }), modify: jest.fn().mockResolvedValue({}) },
  } };
  google.gmail.mockReturnValue(gmail);
  await sendLabEmail({}, { lab, to: 'recipient@example.org', from: lab.Email, subject: 'Reminder', htmlBody: '<p>Hello</p>', labelNames: ['Reminder-email'] });
  expect(gmail.users.messages.send.mock.calls[0][0].requestBody.labelIds).toEqual(['label1']);
  expect(gmail.users.messages.modify).toHaveBeenCalledWith({ userId: 'me', id: 'sent1', resource: { addLabelIds: ['label1'] } });
});

test('family reminder includes actual appointment, lab, and timezone without changing recipients', () => {
  const { buildFamilyReminderBody } = require('../api/utils/reminderTemplates');
  const message = buildFamilyReminderBody({
    AppointmentTime: '2026-11-10T15:00:00Z',
    Family: { NamePrimary: 'Alex Smith', Email: 'alex@example.org' },
    Personnel: { Name: 'Researcher', Role: 'Coordinator' },
    Appointments: [{ Child: { Name: 'Sam' }, PrimaryExperimenter: [], Study: {
      StudyName: 'Learning Together', StudyType: 'In-person', ReminderTemplate: '<p>Preparation for ${{childName}}</p>',
      Lab: { ...lab, TransportationInstructions: '<p>Parking instructions</p>', EmailClosing: '<p>Reply to reschedule</p>' },
    } }],
  }, 'America/Toronto');
  expect(message.to).toBe('Alex Smith<alex@example.org>');
  for (const text of ['10:00 AM EST', 'Learning Together', 'Preparation for Sam', 'Parking instructions', 'Reply to reschedule', 'Your appointment']) expect(message.body).toContain(text);
  expect(message.body.match(/data-drdb-email="v1"/g)).toHaveLength(1);
});

test('quotes or encodes display names that are not valid header atoms', () => {
  const headers = (fields) => Buffer.from(encodeMessage({ subject: 'Hi', body: '<p>x</p>', ...fields }), 'base64url').toString().split('\r\n\r\n')[0];
  expect(headers({ from: 'Child Lab, McMaster <lab@example.org>', to: 'family@example.org' })).toContain('From: "Child Lab, McMaster" <lab@example.org>');
  expect(headers({ from: 'Real Lab<lab@example.org>', to: 'Sarah "Sam" Lee <s@example.org>' })).toContain('To: "Sarah \\"Sam\\" Lee" <s@example.org>');
  expect(headers({ from: 'Real Lab<lab@example.org>', to: 'a@example.org' })).toContain('From: Real Lab <lab@example.org>');
  const encoded = headers({ from: 'Laboratoire Bébé <lab@example.org>', to: 'a@example.org, b@example.org' });
  expect(encoded).toContain(`From: =?UTF-8?B?${Buffer.from('Laboratoire Bébé').toString('base64')}?= <lab@example.org>`);
  expect(encoded).toContain('To: a@example.org, b@example.org');
});
