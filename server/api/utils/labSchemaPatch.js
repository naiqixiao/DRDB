const { DataTypes } = require("sequelize");

// Login includes Lab and therefore selects Timezone even if no override is set.
// sync({ force: false }) creates tables but does not add columns to older ones.
async function patchLabTimezoneSchema(queryInterface) {
  const columns = await queryInterface.describeTable("Lab");
  if (Object.prototype.hasOwnProperty.call(columns, "Timezone")) return;

  try {
    await queryInterface.addColumn("Lab", "Timezone", {
      type: DataTypes.STRING(45),
      allowNull: true,
      defaultValue: "",
    });
  } catch (error) {
    // Another server process may have added it after our describeTable call.
    if (error.original?.errno === 1060 || error.parent?.errno === 1060) {
      const current = await queryInterface.describeTable("Lab");
      if (Object.prototype.hasOwnProperty.call(current, "Timezone")) return;
    }
    throw new Error(
      "Could not add Lab.Timezone. Apply MySQL/migrate_lab_timezone.sql to the application database, then restart the backend. " + error.message
    );
  }
}

module.exports = { patchLabTimezoneSchema };
