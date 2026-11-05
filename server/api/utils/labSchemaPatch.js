const { hasColumn, isDuplicateColumn } = require("./schemaColumns");
const { DataTypes } = require("sequelize");

// Login includes Lab and therefore selects Timezone even if no override is set.
// sync({ force: false }) creates tables but does not add columns to older ones.
async function patchLabTimezoneSchema(queryInterface) {
  const columns = await queryInterface.describeTable("Lab");
  if (hasColumn(columns, "Timezone")) return;

  try {
    await queryInterface.addColumn("Lab", "Timezone", {
      type: DataTypes.STRING(45),
      allowNull: true,
      defaultValue: "",
    });
  } catch (error) {
    // The database confirms the column exists, including when its metadata
    // uses different casing or another process added it concurrently.
    if (isDuplicateColumn(error)) return;
    throw new Error(
      "Could not add Lab.Timezone. Apply MySQL/migrate_lab_timezone.sql to the application database, then restart the backend. " + error.message
    );
  }
}

module.exports = { patchLabTimezoneSchema };
