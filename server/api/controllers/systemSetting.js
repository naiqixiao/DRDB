const model = require("../models/DRDB");
const asyncHandler = require("express-async-handler");
const { reloadAllJobs } = require("../../jobs/scheduler");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");

const BRANDING_DEFAULTS = {
  appTitle: "DRDB - Developmental Research Database",
  loginHeading: "DRDB",
  loginSubheading: "Developmental Research Database System",
  logoUrl: "/logo.png",
  faviconUrl: "/logo.png",
};

const BRANDING_SETTING_KEYS = {
  APP_TITLE: "BrandingAppTitle",
  LOGIN_HEADING: "BrandingLoginHeading",
  LOGIN_SUBHEADING: "BrandingLoginSubheading",
  LOGO_URL: "BrandingLogoUrl",
  FAVICON_URL: "BrandingFaviconUrl",
};

const BRANDING_UPLOAD_DIR = path.join(__dirname, "..", "uploads", "branding");
const BRANDING_ASSET_CLEANUP_GRACE_MS = 10 * 60 * 1000;

const ROLE_CAN_MANAGE_LAB_BRANDING = new Set(["Admin", "PI", "Lab manager"]);

function parsePositiveInt(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function getLabBrandingSettingKey(labId) {
  return `LabBranding_${labId}`;
}

function sanitizeText(value, fallback, maxLength = 120) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, maxLength) : fallback;
}

function sanitizeAssetUrl(value, fallback) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return fallback;

  if (text.startsWith("/") || /^https?:\/\//i.test(text)) {
    return text;
  }

  return fallback;
}

function resolveBrandingAssetUrl(value, fallback) {
  const sanitized = sanitizeAssetUrl(value, fallback);
  const fileName = extractAssetFileName(sanitized);
  if (!fileName) return sanitized;

  const filePath = path.join(BRANDING_UPLOAD_DIR, fileName);
  return fs.existsSync(filePath) ? sanitized : fallback;
}

function buildBrandingFromSettingMap(settingMap) {
  return {
    appTitle: sanitizeText(
      settingMap[BRANDING_SETTING_KEYS.APP_TITLE],
      BRANDING_DEFAULTS.appTitle,
      120
    ),
    loginHeading: sanitizeText(
      settingMap[BRANDING_SETTING_KEYS.LOGIN_HEADING],
      BRANDING_DEFAULTS.loginHeading,
      80
    ),
    loginSubheading: sanitizeText(
      settingMap[BRANDING_SETTING_KEYS.LOGIN_SUBHEADING],
      BRANDING_DEFAULTS.loginSubheading,
      200
    ),
    logoUrl: resolveBrandingAssetUrl(
      settingMap[BRANDING_SETTING_KEYS.LOGO_URL],
      BRANDING_DEFAULTS.logoUrl
    ),
    faviconUrl: resolveBrandingAssetUrl(
      settingMap[BRANDING_SETTING_KEYS.FAVICON_URL],
      BRANDING_DEFAULTS.faviconUrl
    ),
  };
}

function parseLabBrandingOverride(rawValue) {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || parsed.enabled !== true) return null;

    return {
      appTitle: typeof parsed.appTitle === "string" ? parsed.appTitle : null,
      loginHeading: typeof parsed.loginHeading === "string" ? parsed.loginHeading : null,
      loginSubheading:
        typeof parsed.loginSubheading === "string" ? parsed.loginSubheading : null,
      logoUrl: typeof parsed.logoUrl === "string" ? parsed.logoUrl : null,
      faviconUrl: typeof parsed.faviconUrl === "string" ? parsed.faviconUrl : null,
    };
  } catch (error) {
    return null;
  }
}

function ensureBrandingUploadDir() {
  if (!fs.existsSync(BRANDING_UPLOAD_DIR)) {
    fs.mkdirSync(BRANDING_UPLOAD_DIR, { recursive: true });
  }
}

function extractAssetFileName(assetUrl) {
  if (typeof assetUrl !== "string" || !assetUrl.trim()) return null;
  const marker = "/api/systemSetting/branding-assets/";

  let normalizedPath = assetUrl.trim();
  if (/^https?:\/\//i.test(normalizedPath)) {
    try {
      normalizedPath = new URL(normalizedPath).pathname;
    } catch (error) {
      return null;
    }
  }

  const markerIndex = normalizedPath.indexOf(marker);
  if (markerIndex < 0) return null;

  const relativePart = normalizedPath.slice(markerIndex + marker.length);
  const fileName = path.basename(relativePart);
  return fileName || null;
}

function collectReferencedBrandingFiles(rows) {
  const referenced = new Set();

  rows.forEach((row) => {
    if (!row?.SettingKey) return;

    if (
      row.SettingKey === BRANDING_SETTING_KEYS.LOGO_URL ||
      row.SettingKey === BRANDING_SETTING_KEYS.FAVICON_URL
    ) {
      const directFile = extractAssetFileName(row.SettingValue);
      if (directFile) referenced.add(directFile);
      return;
    }

    if (row.SettingKey.startsWith("LabBranding_")) {
      try {
        const parsed = JSON.parse(row.SettingValue || "{}");
        const logoFile = extractAssetFileName(parsed.logoUrl);
        const faviconFile = extractAssetFileName(parsed.faviconUrl);
        if (logoFile) referenced.add(logoFile);
        if (faviconFile) referenced.add(faviconFile);
      } catch (error) {
        // Ignore malformed rows and continue cleanup safely.
      }
    }
  });

  return referenced;
}

async function cleanupUnusedBrandingAssets() {
  ensureBrandingUploadDir();

  const relevantRows = await model.systemSetting.findAll({
    where: {
      [Op.or]: [
        { SettingKey: BRANDING_SETTING_KEYS.LOGO_URL },
        { SettingKey: BRANDING_SETTING_KEYS.FAVICON_URL },
        { SettingKey: { [Op.like]: "LabBranding_%" } },
      ],
    },
  });

  const referenced = collectReferencedBrandingFiles(relevantRows);
  const allFiles = fs.readdirSync(BRANDING_UPLOAD_DIR);

  allFiles.forEach((fileName) => {
    const fullPath = path.join(BRANDING_UPLOAD_DIR, fileName);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) return;
    const isFreshUpload = Date.now() - stat.mtimeMs < BRANDING_ASSET_CLEANUP_GRACE_MS;
    if (!referenced.has(fileName)) {
      if (isFreshUpload) return;
      fs.unlinkSync(fullPath);
    }
  });
}

function decodeBase64Image(payload) {
  if (typeof payload !== "string" || !payload.trim()) return null;

  const input = payload.trim();
  const dataUrlMatch = input.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);

  let mimeType = null;
  let base64Data = input;
  if (dataUrlMatch) {
    mimeType = dataUrlMatch[1].toLowerCase();
    base64Data = dataUrlMatch[2];
  }

  let buffer;
  try {
    buffer = Buffer.from(base64Data, "base64");
  } catch (error) {
    return null;
  }

  if (!buffer || !buffer.length) return null;
  if (buffer.length > 2 * 1024 * 1024) return null; // 2MB cap

  return { mimeType, buffer };
}

function resolveExtension(mimeType, fallbackName = "") {
  const byMime = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
  };

  if (mimeType && byMime[mimeType]) return byMime[mimeType];

  const ext = (fallbackName.split(".").pop() || "").toLowerCase();
  const allowed = new Set(["png", "jpg", "jpeg", "webp", "svg", "ico"]);
  if (!allowed.has(ext)) return "png";
  return ext === "jpeg" ? "jpg" : ext;
}

async function canWriteBranding(req, scope, labId) {
  const requesterId = req?.userData?.id;
  if (!requesterId) return false;

  const requester = await model.personnel.findOne({ where: { id: requesterId } });
  if (!requester || requester.Retired) return false;

  if (requester.Role === "Admin") return true;
  if (scope !== "lab") return false;

  return (
    ROLE_CAN_MANAGE_LAB_BRANDING.has(requester.Role) &&
    Number(requester.FK_Lab) === Number(labId)
  );
}

// Get all system settings (or specific one)
exports.getSettings = asyncHandler(async (req, res) => {
  const { key } = req.query;
  const where = key ? { SettingKey: key } : {};
  
  const settings = await model.systemSetting.findAll({ where });
  
  if (key && settings.length === 0) {
    return res.status(200).json(null);
  }
  
  res.status(200).json(key ? settings[0] : settings);
});

// Public branding settings (no auth): safe, read-only subset for login screen + browser title/icon.
exports.getPublicBranding = asyncHandler(async (req, res) => {
  const brandingKeys = Object.values(BRANDING_SETTING_KEYS);
  const rows = await model.systemSetting.findAll({
    where: { SettingKey: { [Op.in]: brandingKeys } },
  });

  const settingMap = {};
  rows.forEach((row) => {
    settingMap[row.SettingKey] = row.SettingValue;
  });

  const globalBranding = buildBrandingFromSettingMap(settingMap);
  const requestedLabId = parsePositiveInt(req.query.labId);

  if (!requestedLabId) {
    return res.status(200).json(globalBranding);
  }

  const labBrandingSetting = await model.systemSetting.findOne({
    where: { SettingKey: getLabBrandingSettingKey(requestedLabId) },
  });

  const labOverride = parseLabBrandingOverride(labBrandingSetting?.SettingValue);
  if (!labOverride) {
    return res.status(200).json(globalBranding);
  }

  const mergedBranding = {
    appTitle: sanitizeText(labOverride.appTitle, globalBranding.appTitle, 120),
    loginHeading: sanitizeText(labOverride.loginHeading, globalBranding.loginHeading, 80),
    loginSubheading: sanitizeText(
      labOverride.loginSubheading,
      globalBranding.loginSubheading,
      200
    ),
    logoUrl: resolveBrandingAssetUrl(labOverride.logoUrl, globalBranding.logoUrl),
    faviconUrl: resolveBrandingAssetUrl(labOverride.faviconUrl, globalBranding.faviconUrl),
  };

  return res.status(200).json({
    ...mergedBranding,
  });
});

exports.getBrandingAsset = asyncHandler(async (req, res) => {
  const fileName = path.basename(req.params.fileName || "");
  if (!fileName) {
    return res.status(404).json({ message: "Asset not found." });
  }

  const filePath = path.join(BRANDING_UPLOAD_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Asset not found." });
  }

  return res.sendFile(filePath);
});

exports.uploadBrandingAsset = asyncHandler(async (req, res) => {
  const { assetType, scope = "global", labId, fileName = "", fileContentBase64 } = req.body || {};

  if (!["logo", "favicon"].includes(assetType)) {
    return res.status(400).json({ message: "assetType must be 'logo' or 'favicon'." });
  }

  if (!["global", "lab"].includes(scope)) {
    return res.status(400).json({ message: "scope must be 'global' or 'lab'." });
  }

  const targetLabId = scope === "lab" ? parsePositiveInt(labId) : null;
  if (scope === "lab" && !targetLabId) {
    return res.status(400).json({ message: "A valid labId is required for lab scope." });
  }

  const permitted = await canWriteBranding(req, scope, targetLabId);
  if (!permitted) {
    return res.status(403).json({ message: "You do not have permission to update branding assets." });
  }

  const decoded = decodeBase64Image(fileContentBase64);
  if (!decoded) {
    return res.status(400).json({ message: "Invalid image payload. Upload a base64 image <= 2MB." });
  }

  const extension = resolveExtension(decoded.mimeType, fileName);
  ensureBrandingUploadDir();

  const scopePart = scope === "lab" ? `lab-${targetLabId}` : "global";
  const generatedName = `${scopePart}-${assetType}-${Date.now()}.${extension}`;
  const fullPath = path.join(BRANDING_UPLOAD_DIR, generatedName);

  fs.writeFileSync(fullPath, decoded.buffer);

  const assetUrl = `/api/systemSetting/branding-assets/${generatedName}`;
  return res.status(200).json({ assetUrl });
});

// Upsert a system setting
exports.updateSetting = asyncHandler(async (req, res) => {
  const { SettingKey, SettingValue } = req.body;
  
  if (!SettingKey) {
    return res.status(400).json({ message: "SettingKey is required." });
  }

  const [setting, created] = await model.systemSetting.findOrCreate({
    where: { SettingKey },
    defaults: { SettingValue }
  });

  if (!created) {
    await setting.update({ SettingValue });
  }

  // If the general timezone was updated, reload all jobs
  if (SettingKey === "GeneralTimezone") {
    await reloadAllJobs();
  }

  // Keep branding upload storage tidy by deleting unreferenced files.
  const isBrandingSetting =
    SettingKey === BRANDING_SETTING_KEYS.LOGO_URL ||
    SettingKey === BRANDING_SETTING_KEYS.FAVICON_URL ||
    SettingKey.startsWith("LabBranding_");
  if (isBrandingSetting) {
    await cleanupUnusedBrandingAssets();
  }

  res.status(200).json(setting);
});
