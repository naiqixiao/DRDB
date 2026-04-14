import api from "@/services/api";

export default {
  getSettings(key) {
    return api().get("systemSetting", { params: { key } });
  },
  updateSetting(setting) {
    return api().post("systemSetting", setting);
  },
};
