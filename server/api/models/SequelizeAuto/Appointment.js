/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "Appointment",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      FK_Study: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Study",
          key: "id"
        }
      },
      FK_Family: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Family",
          key: "id"
        }
      },
      FK_Child: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Child",
          key: "id"
        }
      },
      FK_Schedule: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Schedule",
          key: "id"
        }
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
      }
    },
    {
      tableName: "Appointment"
    }
  );
};
