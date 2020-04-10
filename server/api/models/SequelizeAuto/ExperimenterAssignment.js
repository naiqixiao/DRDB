/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "ExperimenterAssignment",
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      FK_Experimenter: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Personnel",
          key: "id",
        },
      },
      FK_Appointment: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Appointment",
          key: "id",
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
      },
    },
    {
      tableName: "ExperimenterAssignment",
    }
  );
};
