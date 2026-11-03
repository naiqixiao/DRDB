jest.mock('../api/models/DRDB', () => ({ personnel: { findOne: jest.fn() }, systemSetting: { findOrCreate: jest.fn(), findAll: jest.fn() } }));
jest.mock('../jobs/scheduler', () => ({ reloadAllJobs: jest.fn() }));
const fs = require('fs');
const model = require('../api/models/DRDB');
const controller = require('../api/controllers/systemSetting');
function res() { return { status: jest.fn().mockReturnThis(), json: jest.fn() }; }
const next = error => { throw error; };
const logoUrl = '/api/systemSetting/branding-assets/lab-7-email-logo-123-abc.png';

beforeEach(() => {
  jest.clearAllMocks();
  model.personnel.findOne.mockResolvedValue({ Role: 'Lab manager', FK_Lab: 7, Retired: false });
  model.systemSetting.findAll.mockResolvedValue([]);
  jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  jest.spyOn(fs, 'readdirSync').mockReturnValue([]);
});
afterEach(() => jest.restoreAllMocks());

function request(labId = 7, value = { theme: 'ocean', logoUrl: '' }) {
  return { userData: { id: 1 }, body: { SettingKey: `LabEmailBranding_${labId}`, SettingValue: JSON.stringify(value) } };
}

test('lab manager can persist their own theme and logo', async () => {
  model.systemSetting.findOrCreate.mockResolvedValue([{ SettingKey: 'LabEmailBranding_7' }, true]);
  const response = res();
  await controller.updateSetting(request(7, { theme: 'ocean', logoUrl }), response, next);
  expect(model.systemSetting.findOrCreate).toHaveBeenCalledWith({ where: { SettingKey: 'LabEmailBranding_7' }, defaults: { SettingValue: JSON.stringify({ theme: 'ocean', logoUrl }) } });
  expect(response.status).toHaveBeenCalledWith(200);
});

test.each([
  ['different lab', 8, { theme: 'forest' }, 403],
  ['unknown theme', 7, { theme: 'purple-script' }, 400],
  ['other lab logo', 7, { theme: 'forest', logoUrl: logoUrl.replace('lab-7-', 'lab-8-') }, 400],
])('rejects %s without modifying settings', async (_, labId, value, status) => {
  const response = res();
  await controller.updateSetting(request(labId, value), response, next);
  expect(response.status).toHaveBeenCalledWith(status);
  expect(model.systemSetting.findOrCreate).not.toHaveBeenCalled();
});

test.each([{ Role: 'RA', FK_Lab: 7 }, { Role: 'Lab manager', FK_Lab: 7, Retired: true }])('rejects unauthorized or retired personnel', async person => {
  model.personnel.findOne.mockResolvedValue(person);
  const response = res();
  await controller.updateSetting(request(), response, next);
  expect(response.status).toHaveBeenCalledWith(403);
});

test('validates email logo file contents and size on the server', async () => {
  for (const fileContentBase64 of [
    'data:image/png;base64,' + Buffer.from('<svg onload="bad()">').toString('base64'),
    'data:image/svg+xml;base64,' + Buffer.from('<svg/>').toString('base64'),
    'data:image/png;base64,' + Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64'),
  ]) {
    const response = res();
    await controller.uploadBrandingAsset({ userData: { id: 1 }, body: { assetType: 'email-logo', scope: 'lab', labId: 7, fileContentBase64 } }, response, next);
    expect(response.status).toHaveBeenCalledWith(400);
  }
});

test('uploads a logo into a unique lab-specific file', async () => {
  const write = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  const response = res();
  await controller.uploadBrandingAsset({ userData: { id: 1 }, body: { assetType: 'email-logo', scope: 'lab', labId: 7, fileContentBase64: 'data:image/png;base64,' + png.toString('base64') } }, response, next);
  expect(write).toHaveBeenCalledWith(expect.stringMatching(/lab-7-email-logo-[\d]+-[a-f0-9]+\.png$/), png);
  expect(response.json).toHaveBeenCalledWith({ assetUrl: expect.stringMatching(/^\/api\/systemSetting\/branding-assets\/lab-7-email-logo-/) });
});

test('cleanup preserves saved email logos', async () => {
  const unlink = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
  jest.spyOn(fs, 'readdirSync').mockReturnValue([logoUrl.split('/').pop()]);
  jest.spyOn(fs, 'statSync').mockReturnValue({ isFile: () => true, mtimeMs: 0 });
  model.systemSetting.findAll.mockResolvedValue([{ SettingKey: 'LabEmailBranding_7', SettingValue: JSON.stringify({ theme: 'forest', logoUrl }) }]);
  model.systemSetting.findOrCreate.mockResolvedValue([{}, true]);
  await controller.updateSetting(request(), res(), next);
  expect(unlink).not.toHaveBeenCalled();
});

// MySQL setting keys may be case-insensitive: alternate spelling cannot bypass authorization.
test('rejects noncanonical email setting keys', async () => {
  for (const key of ['labemailbranding_8', 'LabEmailBranding_08']) {
    const req = request(8);
    req.body.SettingKey = key;
    const response = res();
    await controller.updateSetting(req, response, next);
    expect(response.status).toHaveBeenCalledWith(403);
  }
  expect(model.systemSetting.findOrCreate).not.toHaveBeenCalled();
});
