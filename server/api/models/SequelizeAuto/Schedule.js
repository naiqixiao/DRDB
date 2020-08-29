module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "Schedule",
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
      Reminded: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: "0"
      },
      ThankYouEmail: {
        type: DataTypes.BOOLEAN,
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
      FK_Family: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: "0",
        references: {
          model: "Family",
          key: "id"
        }
      },
      eventURL: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      calendarEventId: {
        type: DataTypes.STRING(30),
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
      },
      Completed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: "0"
      }
    },
    {
      tableName: "Schedule"
    }
  );
};
