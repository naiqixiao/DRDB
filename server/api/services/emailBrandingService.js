const fs = require("fs");
const path = require("path");
const { renderEmail, escapeHtml } = require("../utils/emailLayout");

const THEMES = [
  { id: "forest", name: "Forest", accent: "#245c54", tint: "#eef4f1", border: "#d5e2dc" },
  { id: "ocean", name: "Ocean", accent: "#245780", tint: "#eef3f8", border: "#d5e0ec" },
  { id: "plum", name: "Plum", accent: "#70436e", tint: "#f5eff5", border: "#e4d7e4" },
  { id: "burgundy", name: "Burgundy", accent: "#803e4c", tint: "#f8eff1", border: "#ead6dc" },
  { id: "slate", name: "Slate", accent: "#46566c", tint: "#f0f3f7", border: "#dbe1e9" },
];
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "branding");
const ASSET_PREFIX = "/api/systemSetting/branding-assets/";
const settingKey = labId => `LabEmailBranding_${Number(labId)}`;

function normalizeBranding(raw = {}, labId) {
  raw = raw || {};
  const theme = THEMES.some(t => t.id === raw.theme) ? raw.theme : "forest";
  // Only this lab's PNG/JPEG uploads can become email attachments.
  const pattern = new RegExp(`^${ASSET_PREFIX}lab-${Number(labId)}-email-logo-[a-zA-Z0-9-]+\\.(png|jpg)$`);
  const logoUrl = typeof raw.logoUrl === "string" && pattern.test(raw.logoUrl) ? raw.logoUrl : "";
  return { theme, logoUrl };
}

async function loadBranding(labId) {
  if (!Number.isInteger(Number(labId)) || Number(labId) <= 0) return normalizeBranding();
  const model = require("../models/DRDB");
  const row = await model.systemSetting.findOne({ where: { SettingKey: settingKey(labId) } });
  let raw = {};
  try { raw = JSON.parse(row?.SettingValue || "{}"); } catch { /* Older malformed setting: use defaults. */ }
  return normalizeBranding(raw || {}, labId);
}

async function prepareEmail(options, { preview = false, branding } = {}) {
  const labId = options.lab?.id;
  const config = branding ? normalizeBranding(branding, labId) : await loadBranding(labId);
  const theme = THEMES.find(t => t.id === config.theme);
  let htmlBody = renderEmail(options)
    .replace(/#245c54/gi, theme.accent)
    .replace(/#eef4f1/gi, theme.tint)
    .replace(/#d5e2dc/gi, theme.border);
  const inlineImages = [];
  let logo = "";
  if (config.logoUrl) {
    try {
      const content = await fs.promises.readFile(path.join(UPLOAD_DIR, path.basename(config.logoUrl)));
      const mimeType = config.logoUrl.endsWith(".png") ? "image/png" : "image/jpeg";
      const source = preview ? `data:${mimeType};base64,${content.toString("base64")}` : "cid:lab-logo@drdb";
      logo = `<p style="margin:0 0 16px;"><img src="${source}" alt="${escapeHtml(options.lab?.LabName || "Lab")} logo" width="160" style="display:block;width:160px;max-width:100%;height:auto;max-height:96px;object-fit:contain;object-position:left center;border:0;"></p>`;
      if (!preview) inlineImages.push({ cid: "lab-logo@drdb", mimeType, content });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      // Missing optional logo must not block reminders or produce a broken image.
    }
  }
  htmlBody = htmlBody.replace("<!--drdb-email-logo-->", logo);
  return { htmlBody, inlineImages };
}

module.exports = { THEMES, settingKey, normalizeBranding, loadBranding, prepareEmail };
