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
      AppointmentTime: {
        type: DataTypes.DATE,
        allowNull: true
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
      Status: {
        type: DataTypes.ENUM(
          "Confirmed",
          "TBD",
          "Rescheduling",
          "Rescheduled",
          "No Show",
          "Cancelled",
          "Rejected"
        ),
        allowNull: false
      },
      ReminderEmail: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: "0"
      },
      ThankYouEmail: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: "0"
      },
      Completed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: "0"
      },
      Note: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ScheduledBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Personnel",
          key: "id"
        }
      },
      calendarEventId: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      eventURL: {
        type: DataTypes.STRING(150),
        allowNull: true
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
