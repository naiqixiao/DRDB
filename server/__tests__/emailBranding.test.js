jest.mock('../api/models/DRDB', () => ({ systemSetting: { findOne: jest.fn() } }));
const fs = require('fs');
const model = require('../api/models/DRDB');
const { THEMES, normalizeBranding, loadBranding, prepareEmail } = require('../api/services/emailBrandingService');
const { renderEmail } = require('../api/utils/emailLayout');
const { encodeMessage } = require('../api/utils/emailUtil');
const lab = { id: 7, LabName: 'Learning Lab', Email: 'lab@example.org' };
const logoUrl = '/api/systemSetting/branding-assets/lab-7-email-logo-123-abc.png';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');

beforeEach(() => { model.systemSetting.findOne.mockReset().mockResolvedValue(null); });
afterEach(() => jest.restoreAllMocks());

test('loads only the requested lab and handles absent or malformed settings', async () => {
  model.systemSetting.findOne.mockResolvedValue({ SettingValue: JSON.stringify({ theme: 'ocean', logoUrl }) });
  expect(await loadBranding(7)).toEqual({ theme: 'ocean', logoUrl });
  expect(model.systemSetting.findOne).toHaveBeenCalledWith({ where: { SettingKey: 'LabEmailBranding_7' } });
  model.systemSetting.findOne.mockResolvedValue({ SettingValue: '{bad' });
  expect(await loadBranding(8)).toEqual({ theme: 'forest', logoUrl: '' });
  expect(normalizeBranding({ theme: 'injected', logoUrl: 'https://outside.example/logo.png' }, 7)).toEqual({ theme: 'forest', logoUrl: '' });
  expect(normalizeBranding({ logoUrl }, 8).logoUrl).toBe('');
  expect(normalizeBranding({ logoUrl: logoUrl.replace('123-abc.png', '../secret.png') }, 7).logoUrl).toBe('');
});

test.each(THEMES)('$name theme colors apply to a pre-rendered reminder as well as fragments', async theme => {
  const options = { lab, htmlBody: '<p>Reminder</p>', details: [{ label: 'When', value: 'Tomorrow' }] };
  const prepared = await prepareEmail({ ...options, htmlBody: renderEmail(options) }, { branding: { theme: theme.id } });
  expect(prepared.htmlBody).toContain('border-top:5px solid ' + theme.accent);
  expect(prepared.htmlBody).toContain('background:' + theme.tint);
  expect(prepared.htmlBody).not.toContain('<img');
  expect(prepared.htmlBody.match(/data-drdb-email="v1"/g)).toHaveLength(1);
});

test('footer preview and sent message use identical logo bytes with correct MIME nesting', async () => {
  jest.spyOn(fs.promises, 'readFile').mockResolvedValue(png);
  const options = { lab, htmlBody: '<p>Message</p>' };
  const branding = { theme: 'plum', logoUrl };
  const preview = await prepareEmail(options, { preview: true, branding });
  const sent = await prepareEmail(options, { branding });
  expect(preview.htmlBody).toContain(`src="data:image/png;base64,${png.toString('base64')}"`);
  expect(preview.inlineImages).toHaveLength(0);
  expect(sent.htmlBody).toContain('src="cid:lab-logo@drdb"');
  expect(sent.htmlBody.indexOf('<img')).toBeGreaterThan(sent.htmlBody.indexOf('background:#fafbf9'));
  expect(sent.inlineImages).toEqual([{ cid: 'lab-logo@drdb', mimeType: 'image/png', content: png }]);
  const mime = Buffer.from(encodeMessage({ to: 'parent@example.org', from: lab.Email, subject: 'Reminder', body: sent.htmlBody, inlineImages: sent.inlineImages }), 'base64url').toString();
  expect(mime).toContain('Content-Type: multipart/related;');
  expect(mime).toContain('Content-Type: multipart/alternative;');
  expect(mime).toContain('Content-Type: text/plain;');
  expect(mime).toContain('Content-Type: text/html;');
  expect(mime).toContain('Content-ID: <lab-logo@drdb>');
  expect(mime.replace(/\r\n/g, '')).toContain(png.toString('base64'));
});

test('removed or missing logos leave a complete text footer and no attachment', async () => {
  jest.spyOn(fs.promises, 'readFile').mockRejectedValue(Object.assign(new Error('gone'), { code: 'ENOENT' }));
  for (const url of ['', logoUrl]) {
    const prepared = await prepareEmail({ lab, htmlBody: '<p>Message</p>' }, { branding: { theme: 'forest', logoUrl: url } });
    expect(prepared.inlineImages).toHaveLength(0);
    expect(prepared.htmlBody).not.toContain('<img');
    expect(prepared.htmlBody).toContain('lab@example.org');
  }
});
