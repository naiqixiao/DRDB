import api from "@/services/api";
import systemSetting from "@/services/systemSetting";

export const BRANDING_SETTING_KEYS = {
  APP_TITLE: "BrandingAppTitle",
  LOGIN_HEADING: "BrandingLoginHeading",
  LOGIN_SUBHEADING: "BrandingLoginSubheading",
  LOGO_URL: "BrandingLogoUrl",
  FAVICON_URL: "BrandingFaviconUrl",
};

export function getLabBrandingSettingKey(labId) {
  return `LabBranding_${labId}`;
}

export const DEFAULT_BRANDING = {
  appTitle: "DRDB - Developmental Research Database",
  loginHeading: "DRDB",
  loginSubheading: "Developmental Research Database System",
  logoUrl: "/logo.png",
  faviconUrl: "/logo.png",
};

let faviconVersionToken = Date.now();
let lastAppliedFaviconUrl = "";

function sanitizeText(value, fallback, maxLength = 120) {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, maxLength) : fallback;
}

function sanitizeAssetUrl(value, fallback) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return fallback;

  // Allow app-relative assets and remote URLs.
  if (text.startsWith("/") || /^https?:\/\//i.test(text)) {
    return text;
  }

  return fallback;
}

export function normalizeBranding(raw = {}) {
  return {
    appTitle: sanitizeText(raw.appTitle, DEFAULT_BRANDING.appTitle, 120),
    loginHeading: sanitizeText(raw.loginHeading, DEFAULT_BRANDING.loginHeading, 80),
    loginSubheading: sanitizeText(
      raw.loginSubheading,
      DEFAULT_BRANDING.loginSubheading,
      200
    ),
    logoUrl: sanitizeAssetUrl(raw.logoUrl, DEFAULT_BRANDING.logoUrl),
    faviconUrl: sanitizeAssetUrl(raw.faviconUrl, DEFAULT_BRANDING.faviconUrl),
  };
}

export function normalizeLabBranding(raw = {}) {
  const normalized = normalizeBranding(raw);
  return {
    enabled: raw.enabled === true,
    ...normalized,
  };
}

export function fromSystemSettingMap(settingsMap = {}) {
  return normalizeBranding({
    appTitle: settingsMap[BRANDING_SETTING_KEYS.APP_TITLE],
    loginHeading: settingsMap[BRANDING_SETTING_KEYS.LOGIN_HEADING],
    loginSubheading: settingsMap[BRANDING_SETTING_KEYS.LOGIN_SUBHEADING],
    logoUrl: settingsMap[BRANDING_SETTING_KEYS.LOGO_URL],
    faviconUrl: settingsMap[BRANDING_SETTING_KEYS.FAVICON_URL],
  });
}

export function toSystemSettingEntries(brandingConfig = {}) {
  const normalized = normalizeBranding(brandingConfig);
  return [
    { SettingKey: BRANDING_SETTING_KEYS.APP_TITLE, SettingValue: normalized.appTitle },
    { SettingKey: BRANDING_SETTING_KEYS.LOGIN_HEADING, SettingValue: normalized.loginHeading },
    {
      SettingKey: BRANDING_SETTING_KEYS.LOGIN_SUBHEADING,
      SettingValue: normalized.loginSubheading,
    },
    { SettingKey: BRANDING_SETTING_KEYS.LOGO_URL, SettingValue: normalized.logoUrl },
    { SettingKey: BRANDING_SETTING_KEYS.FAVICON_URL, SettingValue: normalized.faviconUrl },
  ];
}

export function toLabBrandingSettingValue(labBrandingConfig = {}) {
  const normalized = normalizeLabBranding(labBrandingConfig);
  return JSON.stringify(normalized);
}

export function fromLabBrandingSettingValue(rawValue) {
  if (!rawValue) {
    return normalizeLabBranding({ enabled: false, ...DEFAULT_BRANDING });
  }

  try {
    const parsed = JSON.parse(rawValue);
    return normalizeLabBranding(parsed || {});
  } catch (error) {
    return normalizeLabBranding({ enabled: false, ...DEFAULT_BRANDING });
  }
}

function inferFaviconMimeType(faviconUrl) {
  const cleanUrl = String(faviconUrl || "").split("?")[0].toLowerCase();
  if (cleanUrl.endsWith(".svg")) return "image/svg+xml";
  if (cleanUrl.endsWith(".ico")) return "image/x-icon";
  if (cleanUrl.endsWith(".webp")) return "image/webp";
  if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

function upsertFaviconLink(relValue, href, type) {
  const link = document.createElement("link");
  link.setAttribute("rel", relValue);
  link.setAttribute("type", type);
  link.setAttribute("href", href);
  document.head.appendChild(link);
}

export function applyBrandingToDocument(brandingConfig = {}) {
  const branding = normalizeBranding(brandingConfig);

  if (typeof document === "undefined") return branding;

  document.title = branding.appTitle;

  if (branding.faviconUrl !== lastAppliedFaviconUrl) {
    faviconVersionToken = Date.now();
    lastAppliedFaviconUrl = branding.faviconUrl;
  }

  const faviconType = inferFaviconMimeType(branding.faviconUrl);
  const separator = branding.faviconUrl.includes("?") ? "&" : "?";
  const faviconHref = `${branding.faviconUrl}${separator}v=${faviconVersionToken}`;

  // Some browsers ignore href mutations on existing icon tags. Replace them fully.
  document
    .querySelectorAll("link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']")
    .forEach((node) => node.remove());

  // Update common favicon relations to work consistently across browsers.
  upsertFaviconLink("icon", faviconHref, faviconType);
  upsertFaviconLink("shortcut icon", faviconHref, faviconType);
  upsertFaviconLink("apple-touch-icon", faviconHref, faviconType);

  return branding;
}

export async function loadPublicBranding(labId) {
  try {
    const params = {};
    if (Number.isInteger(Number(labId)) && Number(labId) > 0) {
      params.labId = Number(labId);
    }

    const response = await api().get("systemSetting/public-branding", { params });
    return normalizeBranding(response.data || {});
  } catch (error) {
    return { ...DEFAULT_BRANDING };
  }
}

export async function loadGlobalBrandingSettings() {
  const keys = Object.values(BRANDING_SETTING_KEYS);
  const responses = await Promise.all(keys.map((key) => systemSetting.getSettings(key)));

  const settingMap = {};
  responses.forEach((response) => {
    if (response.data?.SettingKey) {
      settingMap[response.data.SettingKey] = response.data.SettingValue;
    }
  });

  return fromSystemSettingMap(settingMap);
}

export async function loadLabBrandingSettings(labId) {
  if (!Number.isInteger(Number(labId)) || Number(labId) <= 0) {
    return normalizeLabBranding({ enabled: false, ...DEFAULT_BRANDING });
  }

  const response = await systemSetting.getSettings(getLabBrandingSettingKey(Number(labId)));
  return fromLabBrandingSettingValue(response.data?.SettingValue);
}

export async function saveLabBrandingSettings(labId, labBrandingConfig) {
  const numericLabId = Number(labId);
  if (!Number.isInteger(numericLabId) || numericLabId <= 0) {
    throw new Error("Valid labId is required to save lab branding settings.");
  }

  return systemSetting.updateSetting({
    SettingKey: getLabBrandingSettingKey(numericLabId),
    SettingValue: toLabBrandingSettingValue(labBrandingConfig),
  });
}

export async function uploadBrandingAsset({ assetType, scope = "global", labId, file }) {
  if (!file) {
    throw new Error("File is required.");
  }

  const fileContentBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });

  const payload = {
    assetType,
    scope,
    labId,
    fileName: file.name,
    fileContentBase64,
  };

  const response = await api().post("systemSetting/branding-asset", payload);
  return response.data?.assetUrl;
}

export default {
  BRANDING_SETTING_KEYS,
  DEFAULT_BRANDING,
  normalizeBranding,
  normalizeLabBranding,
  fromSystemSettingMap,
  toSystemSettingEntries,
  toLabBrandingSettingValue,
  fromLabBrandingSettingValue,
  applyBrandingToDocument,
  loadPublicBranding,
  loadGlobalBrandingSettings,
  loadLabBrandingSettings,
  saveLabBrandingSettings,
  uploadBrandingAsset,
  getLabBrandingSettingKey,
};
