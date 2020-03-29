/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "Study",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      StudyName: {
        type: DataTypes.STRING(45),
        allowNull: false,
        unique: true
      },
      MinAge: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
      },
      MaxAge: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
      },
      Description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      EmailTemplate: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      Completed: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: "0"
      },
      FK_Lab: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      StudyType: {
        type: DataTypes.ENUM("Behavioural", "EEG/ERP", "EyeTracking", "fNIRS"),
        allowNull: false
      },
      PrematureParticipant: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: "0"
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
      sequelize,
      tableName: "Study"
    }
  );
};
