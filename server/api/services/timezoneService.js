const model = require("../models/DRDB");

const DEFAULT_TIMEZONE = process.env.TIMEZONE || process.env.TZ || "America/Toronto";

function getLabModel() {
  return (
    model.lab ||
    model.Lab ||
    model?.sequelize?.models?.Lab ||
    model?.sequelize?.models?.lab ||
    null
  );
}

async function getGeneralTimezone() {
  const SystemSettingModel =
    model.systemSetting || model?.sequelize?.models?.SystemSetting;

  if (!SystemSettingModel) return DEFAULT_TIMEZONE;

  try {
    const setting = await SystemSettingModel.findOne({
      where: { SettingKey: "GeneralTimezone" },
    });
    return setting?.SettingValue || DEFAULT_TIMEZONE;
  } catch (error) {
    return DEFAULT_TIMEZONE;
  }
}

async function getEffectiveTimezone(labId) {
  if (!labId) return getGeneralTimezone();

  const LabModel = getLabModel();
  if (!LabModel) return getGeneralTimezone();

  try {
    const lab = await LabModel.findByPk(labId, { attributes: ["Timezone"] });
    return lab?.Timezone || (await getGeneralTimezone());
  } catch (error) {
    return getGeneralTimezone();
  }
}

module.exports = {
  DEFAULT_TIMEZONE,
  getEffectiveTimezone,
  getGeneralTimezone,
  getLabModel,
};
