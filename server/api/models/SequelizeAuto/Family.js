/* jshint indent: 1 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define(
    "Family",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      NameMom: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      NameDad: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      Email: {
        type: DataTypes.STRING(40),
        allowNull: false
      },
      Phone: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      RaceMom: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      RaceDad: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      LanguageMom: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      LanguageDad: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      EnglishPercent: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      Note: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      Vehicle: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      Address: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      LastContactDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      NextContactDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      NextContactNote: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      RecruitmentMethod: {
        type: DataTypes.STRING(30),
        allowNull: true
      },
      CreatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Personnel",
          key: "id"
        }
      },
      UpdatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Personnel",
          key: "id"
        }
      },
      NoMoreContact: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      modelName: "Family",
      tableName: "Family",
      sequelize
    }
  );
};
