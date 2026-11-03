jest.mock('../api/models/DRDB', () => ({ lab: { findByPk: jest.fn() }, personnel: { findOne: jest.fn() }, study: { findAll: jest.fn(), findOne: jest.fn() }, systemSetting: { findOne: jest.fn() } }));
jest.mock('../api/utils/emailUtil', () => ({ sendLabEmail: jest.fn(), getLabOAuth2Client: jest.fn() }));
jest.mock('../api/middleware/check-auth', () => (req, res, next) => { req.userData = { id: 1 }; next(); });
const express = require('express');
const request = require('supertest');
const model = require('../api/models/DRDB');
const { sendLabEmail, getLabOAuth2Client } = require('../api/utils/emailUtil');
const app = express();
app.use(express.json());
app.use('/gmail', require('../api/routes/gmail'));
const input = { lab: 7, to: 'reviewer@example.org', subject: 'Study reminder', body: '<p>Dear Lisa,</p><p>Current unsaved draft for Emma.</p>' };

beforeEach(() => {
  jest.clearAllMocks();
  model.personnel.findOne.mockResolvedValue({ id: 1, FK_Lab: 7, Role: 'RA', Retired: 0 });
  model.lab.findByPk.mockResolvedValue({ id: 7, LabName: 'Learning Lab', Email: 'lab@example.org' });
  model.systemSetting.findOne.mockResolvedValue(null);
  model.study.findAll.mockResolvedValue([]);
  model.study.findOne.mockResolvedValue(null);
  getLabOAuth2Client.mockReset().mockReturnValue({ labClient: true });
  sendLabEmail.mockResolvedValue({ data: { id: 'test1' } });
});

test('sends the current snippet only to the test recipient through the lab renderer', async () => {
  const result = await request(app).post('/gmail/send-test').send({ ...input, cc: 'ignored@example.org', bcc: 'ignored2@example.org' });
  expect(result.status).toBe(200);
  expect(getLabOAuth2Client).toHaveBeenCalledWith(7);
  expect(sendLabEmail).toHaveBeenCalledWith({ labClient: true }, {
    to: input.to, from: 'Learning Lab <lab@example.org>', lab: expect.objectContaining({ id: 7 }),
    subject: '[TEST] Study reminder', htmlBody: input.body, layout: { title: input.subject },
  });
});

test.each(['', 'invalid', 'one@example.org,two@example.org', 'one@example.org\r\nBcc: two@example.org'])('rejects invalid or multiple recipients: %s', async to => {
  const result = await request(app).post('/gmail/send-test').send({ ...input, to });
  expect(result.status).toBe(400);
  expect(sendLabEmail).not.toHaveBeenCalled();
});

test.each([
  { Role: 'RA', FK_Lab: 8, Retired: 0 },
  { Role: 'PI', FK_Lab: 7, Retired: 1 },
])('rejects unauthorized sender %j', async person => {
  model.personnel.findOne.mockResolvedValue(person);
  const result = await request(app).post('/gmail/send-test').send(input);
  expect(result.status).toBe(403);
  expect(getLabOAuth2Client).not.toHaveBeenCalled();
  expect(sendLabEmail).not.toHaveBeenCalled();
});

test('administrator can test a selected lab', async () => {
  model.personnel.findOne.mockResolvedValue({ Role: 'Admin', FK_Lab: 8, Retired: 0 });
  const result = await request(app).post('/gmail/send-test').send(input);
  expect(result.status).toBe(200);
  expect(model.lab.findByPk).toHaveBeenCalledWith(7);
});

test('missing Google connection returns an actionable error without expiring the DRDB login', async () => {
  getLabOAuth2Client.mockImplementation(() => { throw Object.assign(new Error('missing token'), { code: 'ENOENT' }); });
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const result = await request(app).post('/gmail/send-test').send(input);
    expect(result.status).toBe(502);
    expect(result.body.message).toContain('Settings');
    expect(sendLabEmail).not.toHaveBeenCalled();
  } finally { log.mockRestore(); }
});

test('missing lab email cannot send a test', async () => {
  model.lab.findByPk.mockResolvedValue({ id: 7, LabName: 'Learning Lab', Email: null });
  const result = await request(app).post('/gmail/send-test').send(input);
  expect(result.status).toBe(400);
  expect(sendLabEmail).not.toHaveBeenCalled();
});


test('reminder preview uses full backend templates and saved lab branding with fictional family data', async () => {
  const result = await request(app).post('/gmail/reminder-preview').send({ lab: 7, type: 'family-siblings' });
  expect(result.status).toBe(200);
  expect(result.body.htmlBody).toContain('Liam and Emma');
  expect(result.body.htmlBody).toContain('Learning Lab');
  expect(result.body.htmlBody).toContain('Your appointment');
  expect(sendLabEmail).not.toHaveBeenCalled();
});

test('reminder test sends rebuild the sample and override all fixture recipient addresses', async () => {
  const result = await request(app).post('/gmail/send-reminder-test').send({ lab: 7, type: 'family-online', to: input.to });
  expect(result.status).toBe(200);
  const options = sendLabEmail.mock.calls[0][1];
  expect(options.to).toBe(input.to);
  expect(options.subject).toMatch(/^\[TEST\]/);
  expect(options.htmlBody).toContain('Download Link');
  expect(options).not.toHaveProperty('cc');
  expect(options).not.toHaveProperty('bcc');
});

test('only studies belonging to the selected lab may be used', async () => {
  const result = await request(app).post('/gmail/reminder-preview').send({ lab: 7, type: 'family-inperson', studyId: 15 });
  expect(result.status).toBe(404);
  expect(model.study.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 15, FK_Lab: 7 } }));
  expect(sendLabEmail).not.toHaveBeenCalled();
});

test('rejects unknown reminder types and malformed test addresses', async () => {
  const invalidType = await request(app).post('/gmail/reminder-preview').send({ lab: 7, type: 'unknown' });
  expect(invalidType.status).toBe(400);
  const invalidRecipient = await request(app).post('/gmail/send-reminder-test').send({ lab: 7, type: 'completion', to: 'invalid' });
  expect(invalidRecipient.status).toBe(400);
  expect(sendLabEmail).not.toHaveBeenCalled();
});


test('confirmation test emails include the same structured appointment card', async () => {
  model.lab.findByPk.mockResolvedValue({ id: 7, LabName: 'Learning Lab', Email: 'lab@example.org', Timezone: 'America/Toronto' });
  const result = await request(app).post('/gmail/send-test').send({ ...input, appointment: { time: '2026-11-03T10:30', studies: ['Saved Study'], children: ['Emma'], online: true } });
  expect(result.status).toBe(200);
  const options = sendLabEmail.mock.calls[0][1];
  expect(options.layout.details).toEqual(expect.arrayContaining([
    { label: 'When', value: 'Tuesday, November 3, 2026 at 10:30 AM EST' },
    { label: 'Where', value: 'Online — joining details below' },
  ]));
  expect(options.to).toBe(input.to);
});
