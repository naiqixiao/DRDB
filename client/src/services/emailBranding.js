import api from "./api";
import systemSetting from "./systemSetting";
import branding from "./branding";

export default {
  async load(labId) {
    const { data } = await api().get(`systemSetting/email-branding/${labId}`);
    return data;
  },
  save(labId, config) {
    return systemSetting.updateSetting({ SettingKey: `LabEmailBranding_${labId}`, SettingValue: JSON.stringify(config) });
  },
  async preview(labId, config) {
    const { data } = await api().post(`systemSetting/email-branding/${labId}/preview`, config);
    return data.htmlBody;
  },
  uploadLogo(labId, file) {
    return branding.uploadBrandingAsset({ assetType: "email-logo", scope: "lab", labId, file });
  },
};
