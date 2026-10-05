const { DataTypes } = require("sequelize");

/**
 * Adds Family.OnlineStudyOnly to databases created before the field existed.
 * Never throws: a failure (e.g. no ALTER privilege) is logged so the rest of
 * startup — other patches and the first-run seeder — still runs.
 * @returns {Promise<boolean>} true if the column exists after the call
 */
async function patchLegacyFamilySchemaIfNeeded(queryInterface) {
  try {
    const columns = await queryInterface.describeTable("Family");
    if (Object.prototype.hasOwnProperty.call(columns, "OnlineStudyOnly")) {
      return true;
    }
    await queryInterface.addColumn("Family", "OnlineStudyOnly", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    console.log("Patched legacy Family table: added OnlineStudyOnly.");
    return true;
  } catch (error) {
    console.warn(
      "Could not auto-patch legacy Family schema. " +
        "Please apply MySQL/migrate_online_study_only.sql manually:",
      error.message
    );
    return false;
  }
}

module.exports = { patchLegacyFamilySchemaIfNeeded };
