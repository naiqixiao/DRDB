/* jshint indent: 1 */

module.exports = function (sequelize, DataTypes) {
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
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: false
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
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: "0"
      },
      FK_Lab: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'Lab',
          },
          key: 'id'
        }
      },
      FK_Personnel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: 'Personnel',
          },
          key: 'id'
        }
      },
      StudyType: {
        type: DataTypes.ENUM("Behavioural", "EEG/ERP", "EyeTracking", "fNIRS"),
        allowNull: false
      },
      PrematureParticipant: {
        type: DataTypes.ENUM('Include', 'Exclude', 'Only'),
        allowNull: false,
        defaultValue: "Include"
      },
      VisionLossParticipant: {
        type: DataTypes.ENUM('Include', 'Exclude', 'Only'),
        allowNull: false,
        defaultValue: "Include"
      },
      HearingLossParticipant: {
        type: DataTypes.ENUM('Include', 'Exclude', 'Only'),
        allowNull: false,
        defaultValue: "Include"
      },
      IllParticipant: {
        type: DataTypes.ENUM('Include', 'Exclude', 'Only'),
        allowNull: false,
        defaultValue: "Include"
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
