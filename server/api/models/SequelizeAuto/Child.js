/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "Child",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      Name: {
        type: DataTypes.STRING(30),
        allowNull: false
      },
      Sex: {
        type: DataTypes.ENUM("F", "M"),
        allowNull: false
      },
      DoB: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      Age: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      IdWithinFamily: {
        type: DataTypes.STRING(1),
        allowNull: true
      },
      Language: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      HearingLoss: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: "0"
      },
      VisionLoss: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: "0"
      },
      PrematureBirth: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: "0"
      },
      Illness: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: "0"
      },
      Note: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "0"
      },
      FK_Family: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Family",
          key: "id"
        }
      },
      BirthWeight: {
        type: DataTypes.INTEGER,
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
      sequelize,
      modelName: "Child",
      tableName: "Child"
    }
  );
};
