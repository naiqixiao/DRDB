jest.mock('../api/models/DRDB', () => ({ lab: { findByPk: jest.fn() }, systemSetting: { findOne: jest.fn() } }));
jest.mock('../api/utils/emailUtil', () => ({ sendLabEmail: jest.fn() }));
const model = require('../api/models/DRDB');
const { sendLabEmail } = require('../api/utils/emailUtil');
const controller = require('../api/controllers/gmail');
const { prepareEmail } = require('../api/services/emailBrandingService');

beforeEach(() => { jest.clearAllMocks(); model.systemSetting.findOne.mockResolvedValue(null); });
function response() { return { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() }; }

test('preview matches the lab layout used for sending and looks up database branding', async () => {
  const lab = { LabName: 'Real Lab', Email: 'real@example.org', Location: 'Room 1' };
  model.lab.findByPk.mockResolvedValue(lab);
  sendLabEmail.mockResolvedValue({ data: { id: 'sent1' } });
  const req = { oAuth2Client: {}, body: { lab: 4, from: 'wrong@example.org', to: 'family@example.org', subject: 'Welcome', body: '<p>Hello</p>', cc: 'cc@example.org', labelNames: ['Study'] } };
  const preview = response();
  await controller.preview(req, preview, error => { throw error; });
  await controller.send(req, response(), error => { throw error; });
  const options = sendLabEmail.mock.calls[0][1];
  expect(options.from).toBe('Real Lab <real@example.org>');
  expect(options.to).toBe(req.body.to);
  expect(options.cc).toBe(req.body.cc);
  expect(options.labelNames).toEqual(['Study']);
  expect(preview.json.mock.calls[0][0].htmlBody).toBe((await prepareEmail(options, { preview: true })).htmlBody);
});

test('missing lab returns a clear error without sending', async () => {
  model.lab.findByPk.mockResolvedValue(null);
  const res = response();
  await controller.send({ body: { lab: 999 } }, res, error => { throw error; });
  expect(res.status).toHaveBeenCalledWith(404);
  expect(sendLabEmail).not.toHaveBeenCalled();
});


test('study snippet preview uses the selected lab’s saved theme and footer logo', async () => {
  const fs = require('fs');
  const logo = Buffer.from('sample image');
  const read = jest.spyOn(fs.promises, 'readFile').mockResolvedValue(logo);
  model.lab.findByPk.mockResolvedValue({ id: 7, LabName: 'Study Lab', Email: 'lab@example.org' });
  model.systemSetting.findOne.mockResolvedValue({ SettingValue: JSON.stringify({ theme: 'ocean', logoUrl: '/api/systemSetting/branding-assets/lab-7-email-logo-123-abc.png' }) });
  try {
    const res = response();
    await controller.preview({ body: { lab: 7, subject: 'Study confirmation', body: '<p>Dear Lisa,</p><p>Emma will join our study.</p>' } }, res, error => { throw error; });
    const html = res.json.mock.calls[0][0].htmlBody;
    expect(model.lab.findByPk).toHaveBeenCalledWith(7);
    expect(model.systemSetting.findOne).toHaveBeenCalledWith({ where: { SettingKey: 'LabEmailBranding_7' } });
    expect(html).toContain('border-top:5px solid #245780');
    expect(html).toContain('Emma will join our study.');
    expect(html).toContain('src="data:image/png;base64,' + logo.toString('base64') + '"');
    expect(sendLabEmail).not.toHaveBeenCalled();
  } finally { read.mockRestore(); }
});


test('confirmation preview and delivery share the same themed appointment card and effective lab timezone', async () => {
  const lab = { id: 7, LabName: 'Study Lab', Email: 'lab@example.org', Location: 'Room 42', Timezone: 'America/Vancouver' };
  model.lab.findByPk.mockResolvedValue(lab);
  sendLabEmail.mockResolvedValue({ data: { id: 'sent1' } });
  const req = { oAuth2Client: {}, body: { lab: 7, to: 'parent@example.org', subject: 'Study confirmation', body: '<p>Dear Lisa,</p><p>Edited draft.</p>', appointment: {
    time: '2026-11-03T10:30', studies: ['Learning Together'], children: ['Emma'], online: false,
  } } };
  const preview = response();
  await controller.preview(req, preview, error => { throw error; });
  await controller.send(req, response(), error => { throw error; });
  const options = sendLabEmail.mock.calls[0][1];
  expect(options.layout.details).toEqual(expect.arrayContaining([
    { label: 'When', value: 'Tuesday, November 3, 2026 at 10:30 AM PST' },
    { label: 'Where', value: 'Room 42' },
    { label: 'Study', value: 'Learning Together' },
    { label: 'Participating', value: 'Emma' },
  ]));
  const html = preview.json.mock.calls[0][0].htmlBody;
  expect(preview.json.mock.calls[0][0].appointmentIncluded).toBe(true);
  expect(html).toContain('Your appointment');
  expect(html).toContain('Edited draft.');
  expect(html).toBe((await prepareEmail({ ...options, ...options.layout }, { preview: true })).htmlBody);
});
